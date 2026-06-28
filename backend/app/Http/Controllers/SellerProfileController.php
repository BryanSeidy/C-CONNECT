<?php

namespace App\Http\Controllers;

use App\Models\SellerProfile;
use Illuminate\Http\Request;

class SellerProfileController extends Controller
{
    public function show(SellerProfile $sellerProfile)
    {
        return response()->json($sellerProfile->load('user'));
    }

    public function update(Request $request, SellerProfile $sellerProfile)
    {
        $request->validate([
            'business_name' => 'string|max:255',
            'biographie' => 'nullable|string',
            'region' => 'string',
            'is_female_owned' => 'boolean',
            'is_local_producer' => 'boolean',
        ]);

        $sellerProfile->update($request->all());

        return response()->json($sellerProfile);
    }
}
