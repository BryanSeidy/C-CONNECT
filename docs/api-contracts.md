# Contrats API métier — C-Connect

**Agent :** Zai (Backend métier transactionnel)
**Date :** 2026-07-11
**Statut :** Final — toutes les routes ci-dessous sont implémentées et testées.

Ce document décrit les contrats API finaux pour les workflows métier : commandes, paiements, escrow, RFQ, litiges, produits et entreprises. Il sert de référence à Claude2 (frontend) et à l'agent CTO (intégration).

---

## 1. Conventions

- **Authentification :** Bearer token Sanctum (`Authorization: Bearer {token}`)
- **Réponse standard :** `{ "success": bool, "data": mixed, "message": string }`
- **Erreurs :** `422` pour validation métier, `403` pour autorisation, `401` sans token, `404` introuvable.
- **Devise :** XAF (Franc CFA), montants `decimal:2`.
- **Pagination :** `?page=N&pageSize=M` (max 50), réponse `{ items: [], meta: { total, page, pageSize, totalPages } }`.

---

## 2. Cycle de vie Escrow (commandes)

### États finaux `escrow_status`

| Statut | Signification | Qui peut déclencher |
|---|---|---|
| `pending` | Commande créée, en attente de paiement | Acheteur (création) |
| `escrow_locked` | Paiement reçu, escrow verrouillé | Webhook / PaymentController |
| `en_preparation` | Vendeur prépare la commande | Vendeur |
| `expedie` | Commande expédiée | Vendeur |
| `en_transit` | En cours de livraison | Vendeur |
| `livre` | Livrée à l'acheteur (stock consommé) | Vendeur/Acheteur |
| `complete` | Terminée, fonds libérés au vendeur | Acheteur/Admin (release-funds) |
| `annule` | Annulée (stock restitué) | Acheteur (avant escrow_locked) |
| `dispute` | Litige ouvert | Acheteur/Vendeur |

### Transitions de stock

- `livre` / `complete` → **consomme** le stock (`stock` décrémenté, `stock_reserve` libéré)
- `annule` → **restaure** le stock réservé (`stock_reserve` libéré, `stock` intact)

---

## 3. Commandes (`/api/orders`)

### `POST /api/orders` — Créer une commande

**Auth :** Buyer uniquement.
**Body :**
```json
{
  "product_id": 1,
  "quantity": 10,
  "negotiation_id": null,
  "adresse_livraison": "123 Marché Central",
  "ville_livraison": "Yaoundé",
  "telephone_livraison": "+237699000111"
}
```

**Réponse `201` :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "buyer_id": 5,
    "seller_id": 3,
    "montant_total": "25000.00",
    "commission_plateforme": "2500.00",
    "montant_vendeur": "22500.00",
    "escrow_status": "pending",
    "items": [...]
  },
  "message": "Commande créée avec succès. En attente de paiement en séquestre."
}
```

**Règles métier :**
- Le stock est **réservé atomiquement** (`stock_reserve` incrémenté) dans une transaction avec `lockForUpdate`.
- Si `negotiation_id` est fourni : la négociation doit être `ACCEPTED`, appartenir au buyer, porter sur le même produit, et ne pas avoir déjà été convertie. Le prix unitaire devient le prix négocié.
- `422` si stock insuffisant ou produit inactif.

### `GET /api/orders` — Lister mes commandes
- Buyer → ses achats ; Seller → ses ventes ; Admin → tout.

### `GET /api/orders/{order}` — Détail
- Buyer de la commande, Seller de la commande, ou Admin uniquement (sinon `403`).

### `PUT /api/orders/{order}` — Transition lifecycle
**Body :** `{ "escrow_status": "expedie" }`

### `DELETE /api/orders/{order}` — Annuler
- Buyer uniquement, seulement si `escrow_status === 'pending'`. Restitue le stock réservé.

### `POST /api/orders/{order}/release-funds` — Libérer les fonds
- Buyer ou Admin. Passe `escrow_locked`/`livre` → `complete`.

---

## 4. Paiements (`/api/payments`)

### `POST /api/payments/mobile-money/initiate` — Initier un paiement
**Auth :** Buyer (propriétaire de la commande).
**Body :**
```json
{
  "order_id": 1,
  "phone": "+237699123456",
  "payment_method": "mtn_momo"
}
```
**Réponse `200` :**
```json
{
  "success": true,
  "data": {
    "transaction_reference": "CCX-ABC123DEF456",
    "amount": "25000.00",
    "currency": "XAF",
    "payment_method": "mtn_momo",
    "instructions": "Validez le message de débit MTN MoMo en tapant votre code PIN.",
    "order_id": 1
  }
}
```

### `POST /api/payments/mobile-money` — Simulation Mobile Money
**Auth :** Buyer (propriétaire).
**Body :** `{ "order_id": 1, "phone": "+237...", "provider": "MTN|Orange" }`
Verrouille l'escrow (`escrow_locked`) et déclenche l'événement `OrderPlaced`.

### `POST /api/webhooks/payments` — Webhook (callback provider)
**Public** (vérifié par signature HMAC `X-CConnect-Signature`).
**Body :**
```json
{
  "provider": "campay|notchpay|monbillet",
  "payment_method": "mtn_momo|orange_money",
  "transaction_reference": "CCX-ABC123DEF456",
  "status": "successful",
  "amount": 25000,
  "phone": "+237699123456",
  "currency": "XAF"
}
```
**Idempotent** : une `transaction_reference` n'est traitée qu'une fois. Vérifie le montant (tolérance 1 XAF).

---

## 5. Produits (`/api/products` + `/api/catalogue/products`)

### Catalogue public (sans auth)
- `GET /api/catalogue/products` — filtres : `?q=&category=&country=&verified=&availableOnly=&pageSize=`
- `GET /api/catalogue/products/{product}` — accepte **slug ou id** (route binding custom)

### CRUD vendeur (auth seller)
- `GET /api/products/me` — mes produits
- `POST /api/products` — créer (nécessite un `sellerProfile` existant, sinon `403`)
- `PUT /api/products/{product}` — modifier (propriétaire ou admin)
- `DELETE /api/products/{product}` — supprimer (soft delete)

**Payload création :**
```json
{
  "name": "Cacao Premium",
  "description": "Fèves de cacao de qualité supérieure",
  "price": 2500,
  "stock": 200,
  "country": "Centre",
  "category": "Agricoles",
  "unite": "kg",
  "stockMinimum": 5,
  "imageUrl": null
}
```

---

## 6. RFQ (`/api/rfqs`)

### Public
- `GET /api/rfqs` — feed des RFQ actives
- `GET /api/rfqs/{rfq}` — détail

### Authentifié
- `GET /api/rfqs/mine/list` — mes RFQ (buyer)
- `POST /api/rfqs` — créer (buyer uniquement)
- `DELETE /api/rfqs/{rfq}` — annuler (owner uniquement → `annulee`)

**Payload création :**
```json
{
  "titre": "Achat de 500kg de café",
  "description": "Recherche café arabica qualité export",
  "category_id": 1,
  "quantite": 500,
  "unite": "kg",
  "budget_max": 1500000,
  "region_livraison": "Littoral",
  "ville_livraison": "Douala",
  "delai_livraison": "2026-08-01",
  "expire_le": "2026-07-25"
}
```

### Bids
- `POST /api/rfqs/{rfq}/bids` — soumettre une offre (seller avec sellerProfile, 1 bid par RFQ)
- `POST /api/rfqs/{rfq}/bids/{bid}/accept` — accepter (owner buyer → refuse automatiquement les autres bids)
- `POST /api/rfqs/{rfq}/bids/{bid}/reject` — refuser (owner buyer)

---

## 7. Litiges (`/api/disputes`)

- `GET /api/disputes` — lister (participant ou admin)
- `POST /api/disputes` — ouvrir (participant de la commande uniquement)
- `GET /api/disputes/{dispute}` — détail
- `POST /api/disputes/{dispute}/resolve` — résoudre (admin uniquement)

**Payload création :**
```json
{
  "order_id": 1,
  "raison": "marchandise_non_recue|qualite_non_conforme|quantite_incorrecte|produit_endommage|retard_livraison|autre",
  "description": "La commande n'est jamais arrivée.",
  "preuves_urls": ["https://..."]
}
```

**Payload résolution (admin) :**
```json
{
  "decision": "rembourser|liberer|demander_informations",
  "notes_resolution": "Remboursement accordé."
}
```
- `rembourser` → commande `annule`, stock restitué
- `liberer` → commande `complete`, stock consommé

---

## 8. Entreprises (`/api/companies` + `/api/catalogue/companies`)

### Public
- `GET /api/catalogue/companies` — filtres : `?region=&type=&verifiees=&cooperatives=&femmes=&q=`
- `GET /api/catalogue/companies/{company}` — accepte **slug ou id**

### Authentifié
- `POST /api/companies` — créer (associe à l'utilisateur)
- `PUT /api/companies/{company}` — modifier (owner ou admin)
- `PATCH /api/companies/{company}/badges` — mettre à jour les badges (admin uniquement)

---

## 9. Admin (`/api/admin/*`)

**Toutes protégées par middleware `admin`.**

- `GET /api/admin/stats` — KPIs globaux (orders, companies, users, commission, disputes)
- `GET /api/admin/users` — liste paginée, filtres : `?role=&search=`
- `GET /api/admin/disputes` — liste paginée, filtre : `?statut=`
- `GET /api/admin/companies` — liste paginée, filtres : `?statut_verification=&search=`

---

## 10. Négociations (`/api/negotiations`)

- `GET /api/negotiations` — lister (buyer ou seller)
- `POST /api/negotiations` — créer (buyer uniquement)
- `PATCH /api/negotiations/{negotiation}` — update status (accept/decline/counter)

---

## 11. Commandes récurrentes (`/api/recurring-orders`)

- `GET /api/recurring-orders` — lister (buyer ou seller)
- `POST /api/recurring-orders` — créer (buyer uniquement)
- `PATCH /api/recurring-orders/{recurringOrder}/status` — pause/resume/annuler (buyer ou seller)

---

## 12. Tests backend métier

Tous les tests suivants sont **passants** :

| Suite | Tests | Couverture |
|---|---|---|
| `OrderLifecycleTest` | 7 | Création, stock réservé/consommé/restauré, lifecycle complet, autorisations |
| `ProductCrudTest` | 8 | CRUD vendeur protégé, catalogue public, autorisations |
| `PaymentWebhookTest` | 6 | Initiation, signature HMAC, idempotence, montant incorrect |
| `RfqWorkflowTest` | 7 | Create, bid, accept/reject, autorisations, double bid refusé |
| `DisputeWorkflowTest` | 7 | Create, resolve (refund/release), autorisations |
| `AdminAccessTest` | 6 | Stats/users/disputes/companies protégés par rôle admin |

**Commande :** `php artisan test --filter="OrderLifecycleTest|ProductCrudTest|PaymentWebhookTest|RfqWorkflowTest|DisputeWorkflowTest|AdminAccessTest"`
