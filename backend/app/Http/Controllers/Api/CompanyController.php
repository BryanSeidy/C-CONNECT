<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyController extends Controller
{
    /**
     * Public listing — filterable by type, region, badges.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Company::query()
            ->when($request->filled('region'), fn ($q) => $q->byRegion($request->input('region')))
            ->when($request->filled('type'), fn ($q) => $q->byType($request->input('type')))
            ->when($request->boolean('verifiees'), fn ($q) => $q->verified())
            ->when($request->boolean('cooperatives'), fn ($q) => $q->cooperatives())
            ->when($request->boolean('femmes'), fn ($q) => $q->femmesEntrepreneures())
            ->when($request->filled('q'), function ($q) use ($request): void {
                $term = '%' . $request->input('q') . '%';
                $q->where('nom', 'like', $term)
                  ->orWhere('ville', 'like', $term)
                  ->orWhere('description', 'like', $term);
            })
            ->orderByDesc('trust_score')
            ->paginate(min((int) $request->input('pageSize', 12), 50));

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $query->items(),
                'meta' => [
                    'total' => $query->total(),
                    'page' => $query->currentPage(),
                    'pageSize' => $query->perPage(),
                    'totalPages' => $query->lastPage(),
                ],
            ],
        ]);
    }

    /**
     * Public company profile — includes badges and trust score.
     */
    public function show(Company $company): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $company->append('badges'),
        ]);
    }

    /**
     * Create a company and associate it to the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'nom' => ['required', 'string', 'max:255'],
            'type_entreprise' => ['required', 'string', 'in:cooperative,producteur,fabricant,restaurant,hotel,supermarche,grossiste,distributeur,ong,institution,pme,autre'],
            'region' => ['nullable', 'string', 'max:100'],
            'ville' => ['nullable', 'string', 'max:100'],
            'quartier' => ['nullable', 'string', 'max:100'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email_professionnel' => ['nullable', 'email', 'max:255'],
            'rccm' => ['nullable', 'string', 'max:100'],
            'niu' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo_url' => ['nullable', 'url'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $company = Company::create($validator->validated());

        // Associate to authenticated user and their seller profile
        $user = $request->user();
        $user->update(['company_id' => $company->id]);

        if ($user->sellerProfile) {
            $user->sellerProfile->update(['company_id' => $company->id]);
        }

        $company->recalculerTrustScore();

        return response()->json([
            'success' => true,
            'data' => $company->fresh()->append('badges'),
            'message' => 'Profil entreprise créé avec succès.',
        ], 201);
    }

    /**
     * Update a company — only accessible to the owner.
     */
    public function update(Request $request, Company $company): JsonResponse
    {
        if ($request->user()->company_id !== $company->id && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'nom' => ['sometimes', 'string', 'max:255'],
            'region' => ['nullable', 'string', 'max:100'],
            'ville' => ['nullable', 'string', 'max:100'],
            'quartier' => ['nullable', 'string', 'max:100'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'email_professionnel' => ['nullable', 'email'],
            'rccm' => ['nullable', 'string', 'max:100'],
            'niu' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'logo_url' => ['nullable', 'url'],
            'banniere_url' => ['nullable', 'url'],
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $company->update($validator->validated());
        $company->recalculerTrustScore();

        return response()->json([
            'success' => true,
            'data' => $company->fresh()->append('badges'),
            'message' => 'Profil entreprise mis à jour.',
        ]);
    }

    /**
     * Admin: update trust badges.
     */
    public function updateBadges(Request $request, Company $company): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Accès réservé aux administrateurs.'], 403);
        }

        $company->update($request->only([
            'badge_entreprise_verifiee',
            'badge_cooperative_verifiee',
            'badge_femmes_entrepreneures',
            'badge_made_in_cameroon',
            'statut_verification',
        ]));

        $company->recalculerTrustScore();

        return response()->json([
            'success' => true,
            'data' => $company->fresh()->append('badges'),
            'message' => 'Badges mis à jour.',
        ]);
    }
}
