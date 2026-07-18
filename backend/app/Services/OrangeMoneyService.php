<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Client OMAPI Orange Money (Merchant Payment) — Sandbox / Production.
 *
 * Flux documenté dans Guide Utilisateur OMAPI SANDBOX v3.0.0 :
 *   1. POST /token                         → access_token (Basic Auth consumer key/secret)
 *   2. POST /omcoreapis/1.0.2/mp/init      → payToken
 *   3. POST /omcoreapis/1.0.2/mp/pay       → débit initié (PIN marchand + notifUrl)
 *   4. GET  /omcoreapis/1.0.2/mp/push/{t}  → push confirmation PIN sur le téléphone client
 *   5. GET  /omcoreapis/1.0.2/mp/paymentstatus/{t} → statut final
 *
 * Headers sur chaque appel métier : Authorization Bearer + X-AUTH-TOKEN.
 */
class OrangeMoneyService
{
    private const TOKEN_CACHE_KEY = 'orange_money.access_token';
    private const TOKEN_TTL_SECONDS = 3500; // token Orange = 3600s
    private const API_VERSION = '1.0.2';
    private const TIMEOUT_SECONDS = 30;

    public function isConfigured(): bool
    {
        $cfg = $this->config();

        return $cfg['consumer_key'] !== ''
            && $cfg['consumer_secret'] !== ''
            && $cfg['auth_token'] !== ''
            && $cfg['channel_msisdn'] !== ''
            && $cfg['pin'] !== '';
    }

    /**
     * Enchaîne init → pay → push et retourne le payToken + réponse brute.
     *
     * @return array{
     *   pay_token: string,
     *   order_id: string,
     *   init: array<string, mixed>,
     *   pay: array<string, mixed>,
     *   push: array<string, mixed>|null
     * }
     */
    public function initiateMerchantPayment(
        string $subscriberMsisdn,
        int|float|string $amount,
        string $orderId,
        string $description,
        string $notifUrl,
    ): array {
        $this->assertConfigured();

        $msisdn = $this->normalizeMsisdn($subscriberMsisdn);
        $merchantOrderId = $this->truncateOrderId($orderId);
        $amountStr = (string) (int) round((float) $amount);

        $init = $this->mpInit();
        $payToken = $this->extractPayToken($init);

        if ($payToken === '') {
            throw new RuntimeException('Orange Money: payToken manquant après /mp/init.');
        }

        $pay = $this->mpPay([
            'subscriberMsisdn' => $msisdn,
            'channelUserMsisdn' => $this->config()['channel_msisdn'],
            'amount' => $amountStr,
            'description' => mb_substr($description, 0, 125),
            'orderId' => $merchantOrderId,
            'pin' => $this->config()['pin'],
            'payToken' => $payToken,
            'notifUrl' => $notifUrl,
        ]);

        $push = null;
        try {
            $push = $this->mpPush($payToken);
        } catch (\Throwable $e) {
            // Le push est important UX mais le paiement peut déjà être en cours
            // après /mp/pay — on logue et on laisse le polling / notifUrl décider.
            Log::warning('[OrangeMoney] /mp/push a échoué — polling/status reste disponible', [
                'pay_token' => $payToken,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'pay_token' => $payToken,
            'order_id' => $merchantOrderId,
            'init' => $init,
            'pay' => $pay,
            'push' => $push,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getPaymentStatus(string $payToken): array
    {
        $this->assertConfigured();

        return $this->mpPaymentStatus($payToken);
    }

    /**
     * Interprète le payload /mp/paymentstatus (ou webhook) en statut métier.
     *
     * @param array<string, mixed> $payload
     * @return 'pending'|'successful'|'failed'
     */
    public function interpretStatus(array $payload): string
    {
        $candidates = [
            $payload['status'] ?? null,
            $payload['data']['status'] ?? null,
            $payload['confirmtxnstatus'] ?? null,
            $payload['data']['confirmtxnstatus'] ?? null,
            $payload['txnstatus'] ?? null,
            $payload['data']['txnstatus'] ?? null,
        ];

        foreach ($candidates as $raw) {
            if ($raw === null || $raw === '') {
                continue;
            }

            $normalized = strtoupper(trim((string) $raw));

            if (in_array($normalized, ['SUCCESSFUL', 'SUCCESS', 'SUCCEEDED', 'PAID', '200', '0'], true)) {
                return 'successful';
            }

            if (in_array($normalized, ['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'EXPIRED', 'REJECTED', '400', '403', '500'], true)) {
                return 'failed';
            }
        }

        $message = strtolower((string) (
            $payload['confirmtxnmessage']
            ?? $payload['data']['confirmtxnmessage']
            ?? $payload['message']
            ?? ''
        ));

        if (str_contains($message, 'success') || str_contains($message, 'succès') || str_contains($message, 'succes')) {
            return 'successful';
        }

        if (str_contains($message, 'fail') || str_contains($message, 'échou') || str_contains($message, 'annul')) {
            return 'failed';
        }

        return 'pending';
    }

    /**
     * Extrait un txnid / référence Orange depuis une réponse API.
     *
     * @param array<string, mixed> $payload
     */
    public function extractTxnId(array $payload): ?string
    {
        $candidates = [
            $payload['txnid'] ?? null,
            $payload['txnId'] ?? null,
            $payload['data']['txnid'] ?? null,
            $payload['data']['txnId'] ?? null,
            $payload['transactionId'] ?? null,
        ];

        foreach ($candidates as $value) {
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * Normalise un MSISDN camerounais vers le format OMAPI (9 chiffres, sans +237).
     */
    public function normalizeMsisdn(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '237') && strlen($digits) >= 12) {
            $digits = substr($digits, 3);
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = substr($digits, 1);
        }

        if (!preg_match('/^[6-9]\d{8}$/', $digits)) {
            throw new RuntimeException('Orange Money: numéro MSISDN invalide (attendu 9 chiffres camerounais).');
        }

        return $digits;
    }

    // ── Endpoints OMAPI ───────────────────────────────────────────────────────

    /**
     * @return array<string, mixed>
     */
    public function getAccessToken(bool $forceRefresh = false): array
    {
        $this->assertConfigured();

        if (!$forceRefresh) {
            $cached = Cache::get(self::TOKEN_CACHE_KEY);
            if (is_array($cached) && !empty($cached['access_token'])) {
                return $cached;
            }
        }

        $cfg = $this->config();
        $response = Http::asForm()
            ->withBasicAuth($cfg['consumer_key'], $cfg['consumer_secret'])
            ->timeout(self::TIMEOUT_SECONDS)
            ->post($this->tokenUrl(), [
                'grant_type' => 'client_credentials',
            ]);

        if (!$response->successful()) {
            Log::error('[OrangeMoney] Échec génération access token', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('Orange Money: impossible d\'obtenir un access token.');
        }

        /** @var array<string, mixed> $json */
        $json = $response->json() ?? [];
        if (empty($json['access_token'])) {
            throw new RuntimeException('Orange Money: access_token absent de la réponse /token.');
        }

        Cache::put(self::TOKEN_CACHE_KEY, $json, self::TOKEN_TTL_SECONDS);

        return $json;
    }

    /**
     * @return array<string, mixed>
     */
    public function mpInit(): array
    {
        return $this->requestJson('post', $this->apiPath('/mp/init'));
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, mixed>
     */
    public function mpPay(array $body): array
    {
        return $this->requestJson('post', $this->apiPath('/mp/pay'), $body);
    }

    /**
     * @return array<string, mixed>
     */
    public function mpPush(string $payToken): array
    {
        return $this->requestJson('get', $this->apiPath('/mp/push/'.rawurlencode($payToken)));
    }

    /**
     * @return array<string, mixed>
     */
    public function mpPaymentStatus(string $payToken): array
    {
        return $this->requestJson('get', $this->apiPath('/mp/paymentstatus/'.rawurlencode($payToken)));
    }

    // ── HTTP helpers ──────────────────────────────────────────────────────────

    /**
     * @param array<string, mixed>|null $body
     * @return array<string, mixed>
     */
    private function requestJson(string $method, string $url, ?array $body = null, bool $retried = false): array
    {
        $token = $this->getAccessToken();
        $client = $this->authenticatedClient((string) $token['access_token']);

        $response = $method === 'get'
            ? $client->get($url)
            : $client->post($url, $body ?? new \stdClass);

        // Token expiré → refresh une fois puis retry
        if (in_array($response->status(), [401, 403], true) && !$retried) {
            Cache::forget(self::TOKEN_CACHE_KEY);
            $this->getAccessToken(forceRefresh: true);

            return $this->requestJson($method, $url, $body, true);
        }

        if (!$response->successful()) {
            Log::error('[OrangeMoney] Appel API échoué', [
                'method' => strtoupper($method),
                'url' => $url,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException(
                'Orange Money: erreur HTTP '.$response->status().' sur '.$url
            );
        }

        $json = $response->json();

        return is_array($json) ? $json : ['raw' => $response->body()];
    }

    private function authenticatedClient(string $accessToken): PendingRequest
    {
        return Http::withToken($accessToken)
            ->withHeaders([
                'X-AUTH-TOKEN' => $this->config()['auth_token'],
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ])
            ->timeout(self::TIMEOUT_SECONDS)
            ->acceptJson();
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function extractPayToken(array $payload): string
    {
        $candidates = [
            $payload['payToken'] ?? null,
            $payload['paytoken'] ?? null,
            $payload['data']['payToken'] ?? null,
            $payload['data']['paytoken'] ?? null,
            $payload['message'] ?? null,
        ];

        foreach ($candidates as $value) {
            if (is_string($value) && strlen($value) > 8 && !str_contains(strtolower($value), ' ')) {
                return $value;
            }
        }

        return '';
    }

    private function truncateOrderId(string $orderId): string
    {
        $clean = preg_replace('/[^A-Za-z0-9\-_]/', '', $orderId) ?? $orderId;

        return mb_substr($clean, 0, 20);
    }

    private function tokenUrl(): string
    {
        return rtrim($this->config()['base_url'], '/').'/token';
    }

    private function apiPath(string $path): string
    {
        return rtrim($this->config()['base_url'], '/')
            .'/omcoreapis/'.self::API_VERSION
            .$path;
    }

    /**
     * @return array{
     *   base_url: string,
     *   auth_token: string,
     *   consumer_key: string,
     *   consumer_secret: string,
     *   channel_msisdn: string,
     *   pin: string,
     *   mode: string
     * }
     */
    private function config(): array
    {
        return [
            'base_url' => (string) config('services.orange_money.base_url', 'https://api-s1.orange.cm'),
            'auth_token' => (string) config('services.orange_money.auth_token', ''),
            'consumer_key' => (string) config('services.orange_money.consumer_key', ''),
            'consumer_secret' => (string) config('services.orange_money.consumer_secret', ''),
            'channel_msisdn' => (string) config('services.orange_money.channel_msisdn', ''),
            'pin' => (string) config('services.orange_money.pin', ''),
            'mode' => (string) config('services.orange_money.mode', 'sandbox'),
        ];
    }

    private function assertConfigured(): void
    {
        if (!$this->isConfigured()) {
            throw new RuntimeException(
                'Orange Money non configuré. Renseignez ORANGE_MONEY_CONSUMER_KEY, '
                .'ORANGE_MONEY_CONSUMER_SECRET, ORANGE_MONEY_AUTH_TOKEN, '
                .'ORANGE_MONEY_CHANNEL_MSISDN et ORANGE_MONEY_PIN.'
            );
        }
    }
}
