# CEMAC Connect - API Contract (v1)

Base URL: `http://localhost:5000/api`

## Standard de réponse

Toutes les réponses suivent cette forme :

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## 1) Auth

### POST `/auth/register`
- Description: créer un compte utilisateur.
- Body:
```json
{
  "email": "buyer@cemac.com",
  "password": "StrongPass123",
  "fullName": "Alice Ngono",
  "role": "BUYER",
  "companyName": "CEMAC Distribution",
  "country": "CM"
}
```
- Success 201:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "buyer@cemac.com",
    "fullName": "Alice Ngono",
    "role": "BUYER",
    "companyName": "CEMAC Distribution",
    "country": "CM"
  },
  "message": "Utilisateur créé avec succès"
}
```
- Erreur 409 / 400: email déjà utilisé ou champs manquants.

### POST `/auth/login`
- Description: authentifier un utilisateur.
- Body:
```json
{
  "email": "buyer@cemac.com",
  "password": "StrongPass123"
}
```
- Success 200: retourne un token JWT et le profil.
- Erreur 401: identifiants invalides.

## 2) Users

### GET `/users`
- Description: lister les utilisateurs.
- Auth: Bearer token.
- Success 200: tableau utilisateurs.

### GET `/users/me`
- Description: récupérer son profil.
- Auth: Bearer token.

### PUT `/users/me`
- Description: mettre à jour son profil.
- Body: `{ "fullName": "...", "companyName": "...", "country": "..." }`

## 3) Products

### GET `/products`
- Description: liste produits actifs.
- Query: `country`, `category`.

### POST `/products`
- Description: créer un produit.
- Auth: Bearer token.
- Body:
```json
{
  "name": "Maïs jaune",
  "description": "Sac 50kg",
  "price": 12000,
  "country": "CM",
  "category": "agro",
  "stock": 50
}
```
- Success 201.

### GET `/products/:id`
- Description: détail d'un produit.
- Erreur 404 si introuvable.

### PUT `/products/:id`
- Description: modifier son propre produit.
- Auth: Bearer token.

### DELETE `/products/:id`
- Description: suppression logique (`isActive=false`).
- Auth: Bearer token.

## 4) Orders

### POST `/orders`
- Description: créer une commande.
- Auth: Bearer token.
- Body:
```json
{
  "productId": 10,
  "quantity": 2
}
```
- Success 201: calcule `unitPrice` et `total` automatiquement.
- Erreurs: 404 produit indisponible, 400 stock insuffisant.

### GET `/orders`
- Description: récupérer les commandes où l'utilisateur est acheteur ou vendeur.
- Auth: Bearer token.

### PATCH `/orders/:id/status`
- Description: mettre à jour le statut d'une commande.
- Auth: Bearer token.
- Body: `{ "status": "CONFIRMED" }`
- Status possibles: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`.

## 5) Payments

### POST `/payments`
- Description: initialiser un paiement lié à une commande.
- Auth: Bearer token.
- Body:
```json
{
  "orderId": 14,
  "method": "BANK_TRANSFER"
}
```
- Success 201: crée `Payment` + `Escrow(HOLDING)`.

### GET `/payments`
- Description: lister les paiements de l'utilisateur.
- Auth: Bearer token.

### PATCH `/payments/:id`
- Description: changer le statut du paiement.
- Auth: Bearer token.
- Body: `{ "status": "PAID" }`
- Status possibles: `PENDING`, `PAID`, `RELEASED`, `REFUNDED`.

## 6) Escrow

### GET `/escrow/:paymentId`
- Description: détails d'un escrow par paiement.
- Auth: Bearer token.

### PATCH `/escrow/release/:paymentId`
- Description: libérer l'escrow.
- Auth: Bearer token.
- Effet: `Payment.status=RELEASED`, `Escrow.status=RELEASED`, `releasedAt` renseigné.

## 7) Matching

### GET `/matching`
- Description: recommander des fournisseurs/produits.
- Query: `country`, `category`, `limit`.
- Success 200:
```json
{
  "success": true,
  "data": [
    {
      "product": {
        "id": 10,
        "name": "Maïs jaune"
      },
      "score": 1
    }
  ],
  "message": "Recommandations générées"
}
```
