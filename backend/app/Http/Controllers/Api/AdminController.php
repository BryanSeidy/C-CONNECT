<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Dispute;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * AdminController — Statistiques et gestion admin.
 *
 * Toutes les routes de ce contrôleur sont protégées par le middleware 'admin'.
 */
class AdminController extends Controller
{
    /**
     * Statistiques globales de la plateforme.
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => Order::count(),
                'orders_pending' => Order::where('escrow_status', Order::STATUS_PENDING)->count(),
                'orders_escrow_locked' => Order::where('escrow_status', Order::STATUS_ESCROW_LOCKED)->count(),
                'orders_in_transit' => Order::where('escrow_status', Order::STATUS_EN_TRANSIT)->count(),
                'total_companies' => Company::count(),
                'companies_verified' => Company::where('statut_verification', 'verifie')->count(),
                'total_users' => User::count(),
                'total_buyers' => User::where('role', 'buyer')->count(),
                'total_sellers' => User::where('role', 'seller')->count(),
                'commission_total' => Order::where('escrow_status', Order::STATUS_COMPLETE)
                    ->sum('commission_plateforme'),
                'disputes_open' => Dispute::where('statut', 'ouvert')->count(),
                'disputes_in_progress' => Dispute::where('statut', 'en_instruction')->count(),
            ],
        ]);
    }

    /**
     * Liste des utilisateurs avec pagination et filtres.
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::with('gamificationStat')
            ->when($request->filled('role'), fn ($q) => $q->where('role', $request->input('role')))
            ->when($request->filled('search'), function ($q) use ($request): void {
                $term = '%' . $request->input('search') . '%';
                $q->where('nom', 'like', $term)
                  ->orWhere('prenom', 'like', $term)
                  ->orWhere('email', 'like', $term);
            })
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $query,
        ]);
    }

    /**
     * Liste des litiges ouverts et en cours d'instruction.
     */
    public function disputes(Request $request): JsonResponse
    {
        $query = Dispute::with(['order.buyer:id,nom,prenom,email', 'order.seller.user:id,nom,prenom', 'initiateur:id,nom,prenom', 'resolvedBy:id,nom,prenom'])
            ->when($request->filled('statut'), fn ($q) => $q->where('statut', $request->input('statut')))
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $query,
        ]);
    }

    /**
     * Liste des entreprises avec filtres (pour vérification admin).
     */
    public function companies(Request $request): JsonResponse
    {
        $query = Company::with('sellerProfiles.user:id,nom,prenom')
            ->when($request->filled('statut_verification'), fn ($q) => $q->where('statut_verification', $request->input('statut_verification')))
            ->when($request->filled('search'), function ($q) use ($request): void {
                $term = '%' . $request->input('search') . '%';
                $q->where('nom', 'like', $term)
                  ->orWhere('email_professionnel', 'like', $term)
                  ->orWhere('rccm', 'like', $term);
            })
            ->orderByDesc('trust_score')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $query->map(fn ($c) => $c->append('badges')),
        ]);
    }

    /**
     * Santé système — introspection réelle (DB, cache, disque, dernières
     * erreurs applicatives), pas de métriques simulées. Pensé pour un tableau
     * de bord admin, pas un remplacement d'outil de supervision dédié.
     */
    public function health(): JsonResponse
    {
        $checks = [];

        $dbStart = microtime(true);
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $checks['database'] = ['status' => 'ok', 'latencyMs' => round((microtime(true) - $dbStart) * 1000, 1)];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'down', 'message' => $e->getMessage()];
        }

        try {
            $cacheKey = 'health_check_' . now()->timestamp;
            \Illuminate\Support\Facades\Cache::put($cacheKey, true, 5);
            $checks['cache'] = ['status' => \Illuminate\Support\Facades\Cache::get($cacheKey) === true ? 'ok' : 'degraded'];
        } catch (\Throwable $e) {
            $checks['cache'] = ['status' => 'down', 'message' => $e->getMessage()];
        }

        $checks['ai'] = ['status' => app(\App\Services\AiClient::class)->isConfigured() ? 'ok' : 'not_configured'];

        $diskFree = @disk_free_space(storage_path());
        $diskTotal = @disk_total_space(storage_path());
        $checks['storage'] = $diskFree !== false && $diskTotal !== false
            ? ['status' => ($diskFree / $diskTotal) < 0.1 ? 'warning' : 'ok', 'freePercent' => round(($diskFree / $diskTotal) * 100, 1)]
            : ['status' => 'unknown'];

        return response()->json([
            'success' => true,
            'data' => [
                'checks' => $checks,
                'recentErrors' => $this->tailRecentErrors(),
                'checkedAt' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Dernières lignes ERROR/WARNING du log applicatif Laravel — lecture
     * seule, bornée en taille pour rester léger même sur un gros fichier.
     */
    private function tailRecentErrors(int $limit = 15): array
    {
        $logPath = storage_path('logs/laravel.log');
        if (!is_file($logPath) || !is_readable($logPath)) {
            return [];
        }

        // Ne lit que les derniers ~256 Ko du fichier pour éviter de charger
        // un log potentiellement volumineux en mémoire.
        $maxBytes = 262144;
        $size = filesize($logPath);
        $handle = fopen($logPath, 'r');
        if ($handle === false) {
            return [];
        }
        if ($size > $maxBytes) {
            fseek($handle, -$maxBytes, SEEK_END);
        }
        $chunk = fread($handle, $maxBytes) ?: '';
        fclose($handle);

        preg_match_all('/^\[(?<date>[\d\-: ]+)\].*?\.(?<level>ERROR|WARNING|CRITICAL): (?<message>.+)$/m', $chunk, $matches, PREG_SET_ORDER);

        return collect($matches)
            ->reverse()
            ->take($limit)
            ->map(fn ($m) => [
                'date' => $m['date'],
                'level' => $m['level'],
                'message' => str($m['message'])->limit(220)->toString(),
            ])
            ->values()
            ->all();
    }
}
