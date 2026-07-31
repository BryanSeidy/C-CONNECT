<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

/**
 * SocialAuthController
 *
 * Gere le flux OAuth avec les providers sociaux (Google, etc.).
 *
 * IMPORTANT : le navigateur est redirige DIRECTEMENT vers callback() par le
 * provider OAuth (Google) — ce n'est jamais un appel XHR du frontend. Toute
 * reponse ici doit donc etre une redirection HTTP vers une page du frontend,
 * jamais du JSON brut (qui afficherait une page blanche illisible).
 *
 * IMPORTANT : Laravel Socialite doit etre installe :
 *   composer require laravel/socialite
 */
class SocialAuthController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['google'];

    /**
     * GET /api/auth/social/{provider}/redirect
     * Redirige l'utilisateur vers la page OAuth du provider.
     */
    public function redirect(string $provider): JsonResponse|RedirectResponse
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return response()->json(['message' => "Provider '{$provider}' non supporte."], 422);
        }

        if (!class_exists(\Laravel\Socialite\Facades\Socialite::class)) {
            return response()->json([
                'message' => 'Laravel Socialite requis : composer require laravel/socialite',
            ], 501);
        }

        return \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->redirect();
    }

    /**
     * GET /api/auth/social/{provider}/callback
     * Traite le retour du provider, cree ou connecte l'utilisateur, puis
     * redirige vers le frontend avec le token dans le fragment d'URL
     * (jamais envoye au serveur ni logue, contrairement a une query string).
     */
    public function callback(string $provider): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $failureUrl = "{$frontendUrl}/login?social_error=" . urlencode("Provider '{$provider}' non supporte.");

        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return redirect()->away($failureUrl);
        }

        if (!class_exists(\Laravel\Socialite\Facades\Socialite::class)) {
            return redirect()->away("{$frontendUrl}/login?social_error=" . urlencode('Connexion Google indisponible pour le moment.'));
        }

        try {
            /** @var \Laravel\Socialite\Contracts\User $socialUser */
            $socialUser = \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable) {
            return redirect()->away("{$frontendUrl}/login?social_error=" . urlencode('Échec de la connexion Google. Réessayez.'));
        }

        if (!$socialUser->getEmail()) {
            return redirect()->away("{$frontendUrl}/login?social_error=" . urlencode("Impossible de récupérer votre email depuis Google."));
        }

        // Rechercher l'utilisateur par social_id ou email
        $user = User::where('social_provider', $provider)
            ->where('social_id', $socialUser->getId())
            ->first()
            ?? User::where('email', $socialUser->getEmail())->first();

        if ($user === null) {
            // Creation automatique du compte
            $nameParts = explode(' ', trim($socialUser->getName() ?? 'Utilisateur'), 2);
            $user = User::create([
                'prenom'          => $nameParts[0],
                'nom'             => $nameParts[1] ?? $nameParts[0],
                'email'           => $socialUser->getEmail(),
                'password'        => null,
                'role'            => 'buyer',
                'social_provider' => $provider,
                'social_id'       => $socialUser->getId(),
                'sync_ref'        => Str::uuid()->toString(),
                'synced'          => true,
                'email_verified_at' => now(),
            ]);
        } elseif (!$user->social_id) {
            // Mettre a jour les informations OAuth si l'utilisateur existait sans OAuth
            $user->update([
                'social_provider' => $provider,
                'social_id'       => $socialUser->getId(),
            ]);
        }

        $token = $user->createToken('cconnect_oauth_token')->plainTextToken;

        return redirect()->away("{$frontendUrl}/auth/social/callback#token={$token}");
    }
}
