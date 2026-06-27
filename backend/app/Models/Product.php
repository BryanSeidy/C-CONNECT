<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $table = 'Product';

    protected $fillable = [
        'name', 'description', 'price', 'country', 'category',
        'stock', 'isActive', 'producerId', 'imageUrl'
    ];


    public function seller()
    {
        return $this->belongsTo(User::class, 'producerId');
    }
}
