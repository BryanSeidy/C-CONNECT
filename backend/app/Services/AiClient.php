<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Client minimal pour l'API Messages d'Anthropic — pensé pour être partagé
 * par toute fonctionnalité IA de C-Connect (recherche marketplace en
 * langage naturel ici ; potentiellement l'assistant contextuel / génération
 * de descriptions si un autre agent en a besoin — plutôt que dupliquer un
 * appel HTTP similaire, réutiliser ou adapter ce service).
 *
 * Nécessite ANTHROPIC_API_KEY en variable d'environnement. Si absente,
 * isConfigured() retourne false — chaque appelant doit vérifier ce cas et
 * dégrader proprement (ne jamais faire échouer une fonctionnalité "cœur de
 * métier" faute d'IA disponible ; l'IA est un plus, jamais un prérequis).
 */
class AiClient
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const API_VERSION = '2023-06-01';
    private const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';
    private const TIMEOUT_SECONDS = 15;

    public function isConfigured(): bool
    {
        return !empty(config('services.anthropic.api_key'));
    }

    /**
     * @param string $system Instructions système (rôle, format attendu, contraintes).
     * @param string $user Message utilisateur.
     * @param int $maxTokens Limite de tokens en sortie — garder bas pour ce genre
     *   d'usages structurés (coût + latence), augmenter seulement si nécessaire.
     * @return string|null Le texte brut de la réponse, ou null en cas d'échec
     *   (clé absente, timeout, erreur API) — jamais d'exception : appelant
     *   responsable de dégrader proprement.
     */
    public function complete(string $system, string $user, int $maxTokens = 512): ?string
    {
        if (!$this->isConfigured()) {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => config('services.anthropic.api_key'),
                'anthropic-version' => self::API_VERSION,
                'content-type' => 'application/json',
            ])
                ->timeout(self::TIMEOUT_SECONDS)
                ->post(self::API_URL, [
                    'model' => config('services.anthropic.model', self::DEFAULT_MODEL),
                    'max_tokens' => $maxTokens,
                    'system' => $system,
                    'messages' => [
                        ['role' => 'user', 'content' => $user],
                    ],
                ]);

            if (!$response->successful()) {
                Log::warning('AiClient: réponse non-2xx de l\'API Anthropic', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $textBlocks = collect($response->json('content', []))
                ->where('type', 'text')
                ->pluck('text');

            return $textBlocks->isNotEmpty() ? $textBlocks->implode("\n") : null;
        } catch (\Throwable $e) {
            Log::warning('AiClient: exception lors de l\'appel à l\'API Anthropic', [
                'message' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Variante qui demande explicitement un objet JSON en sortie et le
     * décode. Retourne null si l'IA n'est pas configurée, si l'appel échoue,
     * ou si la réponse n'est pas un JSON valide (ne jamais faire confiance
     * aveuglément à la sortie d'un LLM pour du JSON structuré).
     *
     * @return array<string, mixed>|null
     */
    public function completeJson(string $system, string $user, int $maxTokens = 512): ?array
    {
        $raw = $this->complete(
            $system . "\n\nRéponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown.",
            $user,
            $maxTokens
        );

        if ($raw === null) {
            return null;
        }

        // Au cas où le modèle enveloppe quand même la réponse dans des
        // balises ```json — nettoyage défensif avant décodage.
        $cleaned = trim(preg_replace('/^```(?:json)?|```$/m', '', trim($raw)));

        $decoded = json_decode($cleaned, true);
        return is_array($decoded) ? $decoded : null;
    }
}
