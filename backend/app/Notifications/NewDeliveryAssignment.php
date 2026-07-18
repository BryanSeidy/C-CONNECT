<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\DeliveryRequest;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewDeliveryAssignment extends Notification
{
    public function __construct(private readonly DeliveryRequest $deliveryRequest)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $frontendUrl = rtrim((string) config('app.frontend_url'), '/');
        $acceptUrl = "{$frontendUrl}/livraison/reponse/{$this->deliveryRequest->token_reponse}?action=accepter";
        $declineUrl = "{$frontendUrl}/livraison/reponse/{$this->deliveryRequest->token_reponse}?action=refuser";

        return (new MailMessage())
            ->subject('Nouvelle livraison C-Connect à effectuer')
            ->greeting('Nouvelle livraison disponible')
            ->line("Une commande est prête à être livrée à {$this->deliveryRequest->ville_livraison}.")
            ->line("Adresse : " . ($this->deliveryRequest->adresse_livraison ?: 'non précisée, contactez le client'))
            ->line("Téléphone client : {$this->deliveryRequest->telephone_livraison}")
            ->line("Frais de livraison : " . number_format((float) $this->deliveryRequest->frais_livraison, 0, ',', ' ') . ' FCFA')
            ->action('Accepter cette livraison', $acceptUrl)
            ->line("Vous préférez ne pas prendre cette livraison ? [Cliquez ici pour refuser]({$declineUrl})")
            ->line('Merci de répondre rapidement pour que le client soit livré dans les meilleurs délais.');
    }
}
