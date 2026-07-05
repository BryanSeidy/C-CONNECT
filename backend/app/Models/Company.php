<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * @property string $id
 * @property string $nom
 * @property string $slug
 * @property string|null $rccm
 * @property string|null $niu
 * @property string $type_entreprise
 * @property string|null $ville
 * @property string|null $region
 * @property bool $badge_entreprise_verifiee
 * @property bool $badge_cooperative_verifiee
 * @property bool $badge_femmes_entrepreneures
 * @property bool $badge_made_in_cameroon
 * @property int $trust_score
 * @property string $statut_verification
 */
class Company extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'nom',
        'slug',
        'rccm',
        'niu',
        'type_entreprise',
        'ville',
        'quartier',
        'region',
        'telephone',
        'email_professionnel',
        'site_web',
        'description',
        'logo_url',
        'banniere_url',
        'certifications',
        'badge_entreprise_verifiee',
        'badge_cooperative_verifiee',
        'badge_femmes_entrepreneures',
        'badge_made_in_cameroon',
        'trust_score',
        'statut_verification',
    ];

    protected $casts = [
        'certifications' => 'array',
        'badge_entreprise_verifiee' => 'boolean',
        'badge_cooperative_verifiee' => 'boolean',
        'badge_femmes_entrepreneures' => 'boolean',
        'badge_made_in_cameroon' => 'boolean',
        'trust_score' => 'integer',
        'total_transactions' => 'integer',
        'volume_transactions' => 'decimal:2',
        'verifie_le' => 'datetime',
    ];

    protected $attributes = [
        'trust_score' => 50,
        'statut_verification' => 'non_verifie',
        'badge_entreprise_verifiee' => false,
        'badge_cooperative_verifiee' => false,
        'badge_femmes_entrepreneures' => false,
        'badge_made_in_cameroon' => false,
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Company $company): void {
            if (empty($company->slug)) {
                $company->slug = Str::slug($company->nom) . '-' . Str::random(6);
            }
        });
    }

    // ==================== RELATIONS ====================

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function sellerProfiles(): HasMany
    {
        return $this->hasMany(SellerProfile::class);
    }

    // ==================== SCOPES ====================

    public function scopeVerified($query)
    {
        return $query->where('statut_verification', 'verifie');
    }

    public function scopeByRegion($query, string $region)
    {
        return $query->where('region', $region);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type_entreprise', $type);
    }

    public function scopeFemmesEntrepreneures($query)
    {
        return $query->where('badge_femmes_entrepreneures', true);
    }

    public function scopeCooperatives($query)
    {
        return $query->where('badge_cooperative_verifiee', true);
    }

    // ==================== MÉTIER ====================

    /**
     * Recalculate trust score based on business signals.
     * Score is 0-100. Saved automatically after major events.
     */
    public function recalculerTrustScore(): void
    {
        $score = 30; // Base

        if ($this->statut_verification === 'verifie') {
            $score += 30;
        }
        if ($this->rccm) {
            $score += 10;
        }
        if ($this->niu) {
            $score += 10;
        }
        if ($this->badge_made_in_cameroon) {
            $score += 5;
        }
        if ($this->badge_cooperative_verifiee) {
            $score += 5;
        }
        if ($this->badge_femmes_entrepreneures) {
            $score += 5;
        }
        if ($this->total_transactions >= 10) {
            $score += 5;
        }

        $this->update(['trust_score' => min($score, 100)]);
    }

    public function getBadgesAttribute(): array
    {
        $badges = [];

        if ($this->badge_entreprise_verifiee) {
            $badges[] = ['code' => 'entreprise_verifiee', 'label' => 'Entreprise vérifiée'];
        }
        if ($this->badge_cooperative_verifiee) {
            $badges[] = ['code' => 'cooperative_verifiee', 'label' => 'Coopérative vérifiée'];
        }
        if ($this->badge_femmes_entrepreneures) {
            $badges[] = ['code' => 'femmes_entrepreneures', 'label' => 'Entreprise de femmes'];
        }
        if ($this->badge_made_in_cameroon) {
            $badges[] = ['code' => 'made_in_cameroon', 'label' => 'Made in Cameroon'];
        }

        return $badges;
    }
}
