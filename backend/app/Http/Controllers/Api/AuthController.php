<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            // 'email:rfc,dns' exige une résolution DNS réelle au moment de la
            // validation — indisponible en environnement de test/CI hors-ligne,
            // et peu fiable même en production (DNS split-horizon, latence,
            // domaines pro valides mais mal configurés). 'rfc' seul suffit à
            // valider la syntaxe sans dépendance réseau.
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
            // Sécurité : l'inscription publique ne doit JAMAIS permettre de
            // créer un compte admin. Un admin ne peut être créé que par un
            // seeder ou manuellement en base — jamais via cet endpoint.
            'role' => ['sometimes', 'string', Rule::in(['buyer', 'seller'])],
        ]);

        // La table users stocke nom/prenom (pas de colonne 'name' ou
        // 'fullName') — on découpe le nom complet envoyé par le frontend.
        [$prenom, $nom] = $this->splitFullName($validated['name']);

        $user = User::create([
            'nom' => $nom,
            'prenom' => $prenom,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'buyer',
        ]);

        if ($user->role === 'seller') {
            $user->sellerProfile()->create([
                'business_name' => $user->fullName ?: 'Coopérative locale',
                'region' => 'Centre',
            ]);
        }

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

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        return response()->json([
            'message' => 'Login successful.',
            'data' => [
                'user' => $user->loadMissing(['sellerProfile', 'gamificationStat']),
                'token' => $user->createToken('cconnect_auth_token')->plainTextToken
            ]
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

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
            'telephone' => ['sometimes', 'nullable', 'string', 'max:20'],
        ]);

        $user = $request->user();

        // La table users n'a pas de colonne 'name'/'fullName' — on découpe
        // vers nom/prenom. 'companyName'/'country' n'existent nulle part
        // sur users (le nom d'entreprise et la région vivent sur
        // SellerProfile/Company) ; on ne les accepte plus ici pour éviter
        // de refaire planter l'insert comme sur register().
        if (isset($validated['fullName'])) {
            [$prenom, $nom] = $this->splitFullName($validated['fullName']);
            $user->prenom = $prenom;
            $user->nom = $nom;
        }
        if (array_key_exists('telephone', $validated)) {
            $user->telephone = $validated['telephone'];
        }

        $user->save();

        return response()->json(['message' => 'Profile updated successfully.', 'data' => ['user' => $user->fresh()]]);
    }

    /**
     * Découpe un nom complet "Prénom Nom" en [prenom, nom]. S'il n'y a
     * qu'un seul mot, il sert à la fois de prénom et de nom (comme dans
     * SocialAuthController::callback pour la même situation OAuth).
     *
     * @return array{0: string, 1: string}
     */
    private function splitFullName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName), 2);

        return [$parts[0], $parts[1] ?? $parts[0]];
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
                $user->forceFill(['password' => Hash::make($password)])->save();
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
