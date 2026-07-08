<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * SocialAuthController
 *
 * Gere le flux OAuth avec les providers sociaux (Google, etc.).
 *
 * IMPORTANT : Laravel Socialite doit etre installe :
 *   composer require laravel/socialite
 *
 * Si Socialite n'est pas disponible, les routes retournent une erreur 501.
 */
class SocialAuthController extends Controller
{
    private const SUPPORTED_PROVIDERS = ['google'];

    /**
     * GET /api/auth/social/{provider}/redirect
     * Redirige l'utilisateur vers la page OAuth du provider.
     */
    public function redirect(string $provider): JsonResponse|\Illuminate\Http\RedirectResponse
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
     * Traite le retour du provider, cree ou connecte l'utilisateur.
     */
    public function callback(string $provider): JsonResponse
    {
        if (!in_array($provider, self::SUPPORTED_PROVIDERS, true)) {
            return response()->json(['message' => "Provider '{$provider}' non supporte."], 422);
        }

        if (!class_exists(\Laravel\Socialite\Facades\Socialite::class)) {
            return response()->json([
                'message' => 'Laravel Socialite requis : composer require laravel/socialite',
            ], 501);
        }

        try {
            /** @var \Laravel\Socialite\Contracts\User $socialUser */
            $socialUser = \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Echec de l\'authentification OAuth.',
                'detail'  => $e->getMessage(),
            ], 401);
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
                'nom'             => $nameParts[0],
                'prenom'          => $nameParts[1] ?? $nameParts[0],
                'email'           => $socialUser->getEmail() ?? '',
                'password'        => null,
                'role'            => 'buyer',
                'social_provider' => $provider,
                'social_id'       => $socialUser->getId(),
                'sync_ref'        => Str::uuid()->toString(),
                'synced'          => true,
                'email_verified_at' => now(),
            ]);
        } else {
            // Mettre a jour les informations OAuth si l'utilisateur existait sans OAuth
            if (!$user->social_id) {
                $user->update([
                    'social_provider' => $provider,
                    'social_id'       => $socialUser->getId(),
                ]);
            }
        }

        $token = $user->createToken('cconnect_oauth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => [
                'user'  => $user->load(['sellerProfile', 'gamificationStat']),
                'token' => $token,
            ],
        ]);
    }
}
