# Guide Postman - Tester l'API CEMAC Connect sans Frontend

## 1) Installer Postman
1. Télécharger Postman: https://www.postman.com/downloads/
2. Installer et lancer l'application.

## 2) Créer une collection
1. Cliquer sur **New** > **Collection**.
2. Nom: `CEMAC Connect API`.
3. Créer un dossier par module: Auth, Users, Products, Orders, Payments, Escrow, Matching.

## 3) Variables utiles
Dans la collection, ajouter des variables:
- `baseUrl`: `http://localhost:5000/api`
- `token`: vide au début
- `productId`, `orderId`, `paymentId`: vides

## 4) Workflow de test recommandé

### A. Auth - Register (`POST {{baseUrl}}/auth/register`)
Headers:
- `Content-Type: application/json`

Body:
```json
{
  "email": "buyer1@cemac.com",
  "password": "StrongPass123",
  "fullName": "Acheteur Test",
  "role": "BUYER",
  "country": "CM"
}
```

### B. Auth - Login (`POST {{baseUrl}}/auth/login`)
Body:
```json
{
  "email": "buyer1@cemac.com",
  "password": "StrongPass123"
}
```
Copier `data.token` vers la variable `token`.

### C. POST create - Product (`POST {{baseUrl}}/products`)
Headers:
- `Authorization: Bearer {{token}}`
- `Content-Type: application/json`

Body:
```json
{
  "name": "Cacao premium",
  "description": "Sacs de 25kg",
  "price": 15000,
  "country": "CM",
  "category": "agro",
  "stock": 100
}
```

### D. GET read - Products (`GET {{baseUrl}}/products`)
Pas de body.

### E. PUT update - Product (`PUT {{baseUrl}}/products/{{productId}}`)
Headers: Authorization Bearer.
Body:
```json
{
  "price": 14000,
  "stock": 120
}
```

### F. DELETE delete - Product (`DELETE {{baseUrl}}/products/{{productId}}`)
Headers: Authorization Bearer.

## 5) Tester commandes et paiement

### POST order (`POST {{baseUrl}}/orders`)
```json
{
  "productId": {{productId}},
  "quantity": 2
}
```

### POST payment (`POST {{baseUrl}}/payments`)
```json
{
  "orderId": {{orderId}},
  "method": "BANK_TRANSFER"
}
```

### PATCH payment paid (`PATCH {{baseUrl}}/payments/{{paymentId}}`)
```json
{
  "status": "PAID"
}
```

### PATCH escrow release (`PATCH {{baseUrl}}/escrow/release/{{paymentId}}`)
Body vide.

## 6) Vérifications attendues
- Chaque réponse doit contenir: `success`, `data`, `message`.
- Les endpoints protégés doivent répondre `401` sans token.
- Les erreurs métier doivent répondre `400/403/404/409` selon le cas.
