<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
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
}
