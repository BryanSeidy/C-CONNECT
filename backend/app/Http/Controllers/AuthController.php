<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Normalize a user to the structure the frontend expects.
     */
    private function formatUser(User $user): array
    {
        $fullName = $user->fullName
            ?? trim(($user->prenom ?? '') . ' ' . ($user->nom ?? ''))
            ?: $user->email;

        return [
            'id'          => $user->id,
            'email'       => $user->email,
            'fullName'    => $fullName,
            'companyName' => $user->companyName ?? null,
            'country'     => $user->country ?? null,
            'role'        => $user->role ?? ($user->getRoleNames()->first() ?? 'buyer'),
            'isVerified'  => (bool) ($user->isVerified ?? false),
        ];
    }

    public function register(Request $request)
    {
        // Support fullName from frontend → split into prenom/nom
        if ($request->has('fullName') && !$request->has('nom')) {
            $parts = explode(' ', trim($request->fullName), 2);
            $request->merge([
                'prenom' => $parts[0],
                'nom'    => $parts[1] ?? $parts[0],
            ]);
        }

        $validator = Validator::make($request->all(), [
            'nom'       => 'required|string|max:255',
            'prenom'    => 'required|string|max:255',
            'email'     => 'required|string|email|max:255|unique:User',
            'password'  => 'required|string|min:6',
            'telephone' => 'nullable|string|max:20',
            'role'      => 'required|in:buyer,seller',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::create([
            'nom'      => $request->nom,
            'prenom'   => $request->prenom,
            'fullName' => $request->fullName,
            'email'    => $request->email,
            'telephone'=> $request->telephone ?? '',
            'password' => Hash::make($request->password),
            'role'     => $request->role,
        ]);

        if ($request->has('role')) {
            try { $user->assignRole($request->role); } catch (\Throwable $e) {}
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->formatUser($user),
        ]);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 400);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success'      => true,
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $this->formatUser($user),
        ]);
    }
}
