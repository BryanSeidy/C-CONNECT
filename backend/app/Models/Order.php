<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $table = 'Order'; // Existing table name

    protected $fillable = [
        'buyer_id', 'montant_total', 'statut', 'payment_provider'
    ];

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }
}
