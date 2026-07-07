<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
            'role' => ['sometimes', 'string', Rule::in(['buyer', 'seller', 'admin'])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'fullName' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'] ?? 'buyer',
        ]);

        if ($user->role === 'seller') {
            $user->sellerProfile()->create([
                'business_name' => $user->fullName ?? $user->name ?? 'Coopérative locale',
                'region' => 'Centre',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Registration successful.',
            'data' => [
                'user' => $user->loadMissing(['sellerProfile', 'gamificationStat']),
                'token' => $user->createToken('cconnect_auth_token')->plainTextToken
            ]
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();
            return response()->json([
                'message' => 'Login successful.',
                'data' => [
                    'user' => $user->loadMissing(['sellerProfile', 'gamificationStat']),
                    'token' => $user->createToken('cconnect_auth_token')->plainTextToken
                ]
            ]);
        }

        return response()->json(['message' => 'Invalid credentials.'], 401);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logout successful.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => ['user' => $request->user()->loadMissing(['sellerProfile', 'gamificationStat'])]]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fullName' => ['sometimes', 'string', 'max:255'],
            'companyName' => ['sometimes', 'nullable', 'string', 'max:255'],
            'country' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        if (isset($validated['fullName'])) {
            $validated['name'] = $validated['fullName'];
        }

        $user->fill($validated);
        $user->save();

        return response()->json(['message' => 'Profile updated successfully.', 'data' => ['user' => $user->fresh()]]);
    }

    /**
     * Envoie un lien de réinitialisation de mot de passe.
     * Retourne toujours un message générique pour ne pas révéler
     * si un compte existe avec cet email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'string', 'email']]);

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
        ]);
    }

    /**
     * Réinitialise le mot de passe à partir du token reçu par email.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill(['password' => $password])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
        }

        return response()->json(['message' => __($status)], 422);
    }

    /**
     * Renvoie l'email de vérification à l'utilisateur authentifié.
     */
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Cet email est déjà vérifié.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de vérification envoyé.']);
    }

    /**
     * Valide le lien signé reçu par email et marque l'email comme vérifié.
     * La signature est déjà validée par le middleware `signed` de la route.
     */
    public function verifyEmail(Request $request, int $id, string $hash): RedirectResponse
    {
        $user = User::findOrFail($id);
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return redirect()->away("{$frontendUrl}/login?email_verification=invalid");
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->away("{$frontendUrl}/login?email_verification=success");
    }
}
