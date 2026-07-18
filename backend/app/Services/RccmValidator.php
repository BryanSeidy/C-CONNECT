<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Vérification automatique du RCCM (Registre du Commerce et du Crédit
 * Mobilier) saisi par un vendeur.
 *
 * IMPORTANT — ce que ce service fait et ne fait PAS :
 *   ✓ Vérifie que le numéro respecte le FORMAT légal camerounais
 *     (ex: RC/DLA/2020/B/1234) et que le code ville / l'année / le type
 *     sont plausibles.
 *   ✗ Ne consulte PAS le registre officiel du greffe pour confirmer que ce
 *     RCCM existe réellement ou correspond bien à l'entreprise déclarée —
 *     aucune API publique connue n'expose ce registre pour une vérification
 *     automatisée. Un format valide n'est donc qu'un premier filtre ; la
 *     vérification finale reste humaine (admin, via statut_verification).
 *
 * Format légal : RC/{CODE_VILLE}/{ANNÉE}/{TYPE}/{NUMÉRO}
 *   - CODE_VILLE : 2 à 4 lettres (ex: DLA=Douala, YAO=Yaoundé, BUE=Buea...)
 *   - ANNÉE : 4 chiffres, plausible (>= 1960, <= année courante)
 *   - TYPE : A (personne physique) ou B (personne morale/société)
 *   - NUMÉRO : 1 à 6 chiffres
 */
class RccmValidator
{
    private const PATTERN = '/^RC\/([A-Z]{2,4})\/(\d{4})\/([AB])\/(\d{1,6})$/';

    /** Codes ville usuels — liste non exhaustive, sert juste à améliorer le message d'erreur, pas à bloquer. */
    private const KNOWN_CITY_CODES = [
        'DLA' => 'Douala', 'YAO' => 'Yaoundé', 'BUE' => 'Buea', 'BAF' => 'Bafoussam',
        'GAR' => 'Garoua', 'MAR' => 'Maroua', 'NGA' => 'Ngaoundéré', 'BER' => 'Bertoua',
        'EBO' => 'Ebolowa', 'KRI' => 'Kribi', 'LIM' => 'Limbe', 'DSC' => 'Dschang',
    ];

    public function validate(?string $rccm): RccmValidationResult
    {
        if (!$rccm) {
            return new RccmValidationResult(valide: false, message: 'Numéro RCCM manquant.');
        }

        $normalized = strtoupper(trim($rccm));

        if (!preg_match(self::PATTERN, $normalized, $matches)) {
            return new RccmValidationResult(
                valide: false,
                message: "Format invalide. Le RCCM camerounais suit le format RC/VILLE/ANNÉE/TYPE/NUMÉRO, "
                    . "par exemple RC/DLA/2020/B/1234.",
                normalized: $normalized,
            );
        }

        [, $codeVille, $annee, $type, $numero] = $matches;
        $anneeInt = (int) $annee;
        $anneeCourante = (int) date('Y');

        if ($anneeInt < 1960 || $anneeInt > $anneeCourante) {
            return new RccmValidationResult(
                valide: false,
                message: "L'année du RCCM ({$annee}) n'est pas plausible.",
                normalized: $normalized,
            );
        }

        $villeConnue = array_key_exists($codeVille, self::KNOWN_CITY_CODES);

        return new RccmValidationResult(
            valide: true,
            message: $villeConnue
                ? "Format valide — " . self::KNOWN_CITY_CODES[$codeVille] . ", " . $annee . "."
                : "Format valide, mais le code ville \"{$codeVille}\" n'est pas dans notre liste usuelle — "
                    . "vérifiez qu'il n'y a pas de faute de frappe.",
            normalized: $normalized,
            codeVille: $codeVille,
            annee: $anneeInt,
            type: $type,
        );
    }
}
