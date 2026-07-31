<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DeliveryPartner;
use App\Models\DeliveryRequest;
use App\Models\Order;
use App\Notifications\NewDeliveryAssignment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * Contacte automatiquement un livreur sous-traitant disponible dès qu'un
 * acheteur valide sa commande (paiement confirmé) en ayant choisi la
 * livraison à domicile.
 *
 * IMPORTANT — ce que ce service fait et ne fait PAS :
 *   ✓ Sélectionne un livreur actif dans la région de livraison (le moins
 *     chargé en priorité, pour répartir la charge) et l'assigne.
 *   ✓ Envoie une vraie notification email avec un lien signé pour
 *     accepter/refuser sans avoir de compte sur la plateforme.
 *   ✗ Ne contacte PAS le livreur par SMS ou appel téléphonique automatique —
 *     aucune intégration avec un fournisseur SMS/voix (Twilio ou équivalent
 *     local) n'est configurée, faute de credentials. L'email est le seul
 *     canal réellement fonctionnel pour l'instant ; le numéro de téléphone
 *     du livreur est stocké et affiché à l'admin pour un contact manuel en
 *     attendant une vraie intégration SMS.
 */
class DeliveryDispatchService
{
    public function dispatch(Order $order, float $fraisLivraison): DeliveryRequest
    {
        $partner = $this->findAvailablePartner($order->ville_livraison);

        $deliveryRequest = DeliveryRequest::create([
            'order_id' => $order->id,
            'delivery_partner_id' => $partner?->id,
            'frais_livraison' => $fraisLivraison,
            'ville_livraison' => $order->ville_livraison,
            'adresse_livraison' => $order->adresse_livraison,
            'telephone_livraison' => $order->telephone_livraison,
            'statut' => $partner ? 'assignee' : 'en_attente_assignation',
            'assignee_le' => $partner ? now() : null,
        ]);

        if ($partner) {
            $partner->increment('livraisons_en_cours');
            $this->notifyPartner($partner, $deliveryRequest);
        } else {
            Log::warning('DeliveryDispatchService: aucun livreur disponible', [
                'order_id' => $order->id,
                'region' => $order->ville_livraison,
            ]);
        }

        return $deliveryRequest;
    }

    private function findAvailablePartner(?string $region = null): ?DeliveryPartner
    {
        return DeliveryPartner::query()
            ->actif()
            ->when($region, fn ($q) => $q->dansLaRegion($region))
            ->orderBy('livraisons_en_cours') // le moins chargé d'abord — répartition équitable
            ->first();
    }

    private function notifyPartner(DeliveryPartner $partner, DeliveryRequest $deliveryRequest): void
    {
        if (!$partner->email) {
            Log::info('DeliveryDispatchService: livreur sans email, notification impossible', [
                'partner_id' => $partner->id,
                'delivery_request_id' => $deliveryRequest->id,
            ]);
            return;
        }

        try {
            Notification::route('mail', $partner->email)
                ->notify(new NewDeliveryAssignment($deliveryRequest));
        } catch (\Throwable $e) {
            Log::error('DeliveryDispatchService: échec envoi notification livreur', [
                'partner_id' => $partner->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
