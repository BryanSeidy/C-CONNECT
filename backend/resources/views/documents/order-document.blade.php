<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>{{ $documentTitle }} — {{ $order->id }}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #0a1f24;
    font-size: 12.5px;
    line-height: 1.5;
    margin: 0;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0a2e36;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .brand { font-size: 20px; font-weight: 700; color: #0a2e36; letter-spacing: -0.02em; }
  .brand small { display: block; font-size: 10px; font-weight: 500; color: #6b7a7c; letter-spacing: 0.04em; text-transform: uppercase; margin-top: 2px; }
  .doc-meta { text-align: right; }
  .doc-title { font-size: 16px; font-weight: 700; color: #0a2e36; text-transform: uppercase; letter-spacing: 0.04em; }
  .doc-ref { font-size: 12px; color: #6b7a7c; margin-top: 4px; font-family: 'Courier New', monospace; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
  .party { flex: 1; border: 1px solid #d9dfe0; border-radius: 6px; padding: 14px 16px; }
  .party h4 { margin: 0 0 8px 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #b9892a; }
  .party p { margin: 0 0 3px 0; }
  .party .legal { color: #6b7a7c; font-size: 11px; margin-top: 6px; }
  table.lines { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  table.lines th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7a7c; border-bottom: 1.5px solid #0a2e36; padding: 8px 6px; }
  table.lines td { padding: 10px 6px; border-bottom: 1px solid #e3e8e9; }
  table.lines td.num, table.lines th.num { text-align: right; }
  .totals { width: 280px; margin-left: auto; }
  .totals .row { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .row.grand { border-top: 2px solid #0a2e36; margin-top: 6px; padding-top: 10px; font-weight: 700; font-size: 14px; color: #0a2e36; }
  .status-badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; background: #e8f3ed; color: #1e7a4d; }
  .footer-note { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e3e8e9; font-size: 10.5px; color: #6b7a7c; }
  .print-bar { text-align: right; margin-bottom: 16px; }
  .print-bar button { background: #0a2e36; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
  @media print { .print-bar { display: none; } }
</style>
</head>
<body>

  <div class="print-bar"><button onclick="window.print()">Imprimer / Enregistrer en PDF</button></div>

  <div class="header">
    <div class="brand">
      C-Connect
      <small>Plateforme B2B de sourcing — Cameroun</small>
    </div>
    <div class="doc-meta">
      <div class="doc-title">{{ $documentTitle }}</div>
      <div class="doc-ref">Réf. {{ strtoupper(substr($order->id, 0, 8)) }} · {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h4>Acheteur</h4>
      <p><strong>{{ $order->buyer->companyName ?? $order->buyer->fullName ?? $order->buyer->name }}</strong></p>
      <p>{{ $order->ville_livraison ?? '—' }}</p>
      <p>{{ $order->telephone_livraison ?? '' }}</p>
    </div>
    <div class="party">
      <h4>Fournisseur</h4>
      <p><strong>{{ $order->seller->business_name ?? '—' }}</strong></p>
      <p>{{ $order->seller->ville ?? $order->seller->region ?? '—' }}</p>
      @if($order->seller->rccm ?? null)
        <p class="legal">RCCM : {{ $order->seller->rccm }}</p>
      @endif
      @if($order->seller->niu ?? null)
        <p class="legal">NIU : {{ $order->seller->niu }}</p>
      @endif
    </div>
  </div>

  <table class="lines">
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="num">Quantité</th>
        <th class="num">Prix unitaire</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      @forelse($order->items as $item)
        <tr>
          <td>{{ $item->product->nom ?? 'Produit' }}</td>
          <td class="num">{{ $item->quantite ?? $item->quantity ?? 1 }}</td>
          <td class="num">{{ number_format((float) ($item->prix_unitaire ?? 0), 0, ',', ' ') }} XAF</td>
          <td class="num">{{ number_format((float) (($item->prix_unitaire ?? 0) * ($item->quantite ?? $item->quantity ?? 1)), 0, ',', ' ') }} XAF</td>
        </tr>
      @empty
        <tr>
          <td colspan="4">{{ $order->seller->business_name ?? 'Produit commandé' }}</td>
        </tr>
      @endforelse
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Sous-total</span><span>{{ number_format((float) $order->montant_total, 0, ',', ' ') }} XAF</span></div>
    @if($documentType === 'invoice')
      <div class="row"><span>Commission plateforme</span><span>{{ number_format((float) $order->commission_plateforme, 0, ',', ' ') }} XAF</span></div>
    @endif
    <div class="row grand"><span>Total {{ $documentType === 'invoice' ? 'TTC' : '' }}</span><span>{{ number_format((float) $order->montant_total, 0, ',', ' ') }} XAF</span></div>
  </div>

  <p><span class="status-badge">Statut commande : {{ str_replace('_', ' ', $order->escrow_status) }}</span></p>

  <div class="footer-note">
    @if($documentType === 'purchase_order')
      Ce bon de commande confirme l'engagement de l'acheteur. Le paiement sera retenu en séquestre par C-Connect jusqu'à confirmation de réception.
    @elseif($documentType === 'invoice')
      Facture générée automatiquement par C-Connect. Document à conserver pour votre comptabilité.
    @else
      Ce bon de livraison atteste de l'expédition de la marchandise par le fournisseur.
    @endif
  </div>

</body>
</html>
