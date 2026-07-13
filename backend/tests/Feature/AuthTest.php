<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Les routes auth sont throttle:6,1 (protection brute-force en
        // production). RefreshDatabase réinitialise la DB entre tests mais
        // PAS le cache du rate limiter — PHPUnit exécute toute la classe
        // dans le même process, donc les ~8 requêtes de cette suite vers
        // /auth/register et /auth/login épuisaient la limite et faisaient
        // échouer les derniers tests avec un 429 inattendu au lieu du
        // statut réellement testé. Désactivé uniquement pour cette suite —
        // le comportement de throttle réel n'est pas ce qu'on teste ici.
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function test_a_buyer_can_register_and_receives_a_token_and_user(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Marie Ngono',
            'email' => 'marie.ngono@example.cm',
            'password' => 'Password@123!',
            'password_confirmation' => 'Password@123!',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.user.role', 'buyer');
        $response->assertJsonStructure(['data' => ['user' => ['id', 'email', 'role'], 'token']]);

        $this->assertDatabaseHas('users', [
            'email' => 'marie.ngono@example.cm',
            'role' => 'buyer',
            'nom' => 'Ngono',
            'prenom' => 'Marie',
        ]);
    }

    public function test_a_seller_registering_gets_an_auto_created_seller_profile(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Jean Ateba',
            'email' => 'jean.ateba@example.cm',
            'password' => 'Password@123!',
            'password_confirmation' => 'Password@123!',
            'role' => 'seller',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('data.user.role', 'seller');

        $user = User::where('email', 'jean.ateba@example.cm')->firstOrFail();
        $this->assertNotNull($user->sellerProfile);
    }

    /**
     * Sécurité critique : l'inscription publique ne doit JAMAIS permettre de
     * créer un compte admin, quelle que soit la valeur envoyée par le client.
     */
    public function test_public_registration_cannot_create_an_admin_account(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Attacker Test',
            'email' => 'attacker@example.cm',
            'password' => 'Password@123!',
            'password_confirmation' => 'Password@123!',
            'role' => 'admin',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.cm']);
    }

    public function test_registration_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@example.cm']);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.cm',
            'password' => 'Password@123!',
            'password_confirmation' => 'Password@123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_login_succeeds_with_correct_credentials(): void
    {
        User::factory()->create([
            'email' => 'buyer@example.cm',
            'password' => Hash::make('Password@123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'buyer@example.cm',
            'password' => 'Password@123!',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['data' => ['user', 'token']]);
    }

    public function test_login_fails_with_wrong_password_and_does_not_leak_which_field_is_wrong(): void
    {
        User::factory()->create([
            'email' => 'buyer2@example.cm',
            'password' => Hash::make('Password@123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'buyer2@example.cm',
            'password' => 'WrongPassword!',
        ]);

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Invalid credentials.');
    }

    public function test_login_fails_for_unknown_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nobody@example.cm',
            'password' => 'Password@123!',
        ]);

        $response->assertStatus(401);
    }

    public function test_me_requires_a_valid_bearer_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);

        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertOk();

        // Le même token ne doit plus fonctionner après logout.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/me')
            ->assertStatus(401);
    }
}
