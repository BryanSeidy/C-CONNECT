# Documentation API - CEMAC Connect

## Introduction

Cette API backend alimente CEMAC Connect, une plateforme B2B entre producteurs et acheteurs. Elle respecte une architecture modulaire Express + TypeScript + Prisma.

- Base URL locale: `http://localhost:5000/api`
- Authentification: JWT Bearer
- Format standard de réponse:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

## Auth

### `POST /auth/register`
Créer un compte.

**Request**
```json
{
  "email": "producer@cemac.com",
  "password": "StrongPass123",
  "fullName": "Jean Mvondo",
  "role": "PRODUCER",
  "companyName": "Agro CEMAC",
  "country": "CM"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "producer@cemac.com",
    "fullName": "Jean Mvondo",
    "role": "PRODUCER",
    "companyName": "Agro CEMAC",
    "country": "CM"
  },
  "message": "Utilisateur créé avec succès"
}
```

### `POST /auth/login`
Connexion et génération de JWT.

## Users

### `GET /users`
Lister les utilisateurs (auth requis).

### `GET /users/me`
Récupérer son profil (auth requis).

### `PUT /users/me`
Mettre à jour son profil (auth requis).

## Products

### `GET /products`
Lister les produits actifs. Filtres optionnels: `country`, `category`.

### `POST /products`
Créer un produit (auth requis).

### `GET /products/:id`
Lire le détail d'un produit.

### `PUT /products/:id`
Mettre à jour son propre produit (auth requis).

### `DELETE /products/:id`
Supprimer logiquement son produit (auth requis).

## Orders

### `POST /orders`
Créer une commande à partir d'un produit.

Exemple request:
```json
{
  "productId": 10,
  "quantity": 3
}
```

### `GET /orders`
Lister les commandes de l'utilisateur (acheteur/vendeur).

### `PATCH /orders/:id/status`
Mettre à jour le statut (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).

## Payments

### `POST /payments`
Créer un paiement pour une commande. Crée aussi un escrow en `HOLDING`.

### `GET /payments`
Lister les paiements visibles par l'utilisateur.

### `PATCH /payments/:id`
Mettre à jour le statut (`PENDING`, `PAID`, `RELEASED`, `REFUNDED`).

## Escrow

### `GET /escrow/:paymentId`
Récupérer le détail escrow associé au paiement.

### `PATCH /escrow/release/:paymentId`
Libérer le paiement escrow.

## Matching

### `GET /matching`
Retourner une liste de recommandations de fournisseurs/produits.

Exemple: `/matching?country=CM&category=agro&limit=5`
