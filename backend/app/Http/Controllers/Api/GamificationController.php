<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GamificationStat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GamificationController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $stat = GamificationStat::firstOrCreate(['user_id' => $request->user()->id]);

        return response()->json(['data' => ['points' => $stat->points, 'total_sales' => $stat->total_sales, 'quality_rating' => $stat->quality_rating, 'badges' => $stat->badges_unlocked ?? []]]);
    }
}
