# CEMAC Connect

CEMAC Connect est une marketplace B2B régionale conçue pour relier producteurs et acheteurs de la zone CEMAC.
Le projet est structuré en monorepo pour simplifier le travail d'équipe et l'évolution fonctionnelle.

## Fonctionnalités

- Authentification JWT (inscription/connexion)
- Gestion utilisateurs
- CRUD produits (liste, détail, création)
- Création et consultation de commandes
- Simulation de paiement escrow (`PENDING`, `PAID`, `RELEASED`)
- Matching simple des fournisseurs par pays et catégorie

## Stack technique

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Axios
- Context API pour auth

### Backend
- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT + bcrypt

## Architecture du projet

```bash
.
├── frontend/
│   └── src/
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── middlewares/
│       ├── modules/
│       └── utils/
├── docs/
├── docker-compose.yml
└── README.md
```

## Installation

## 1) Pré-requis

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (ou Docker)

## 2) Cloner et installer

```bash
git clone <repo-url>
cd C-CONNECT
npm install
npm install --workspace backend
npm install --workspace frontend
```

## 3) Variables d'environnement

Copier les fichiers d'exemple:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

## 4) Base de données Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## 5) Lancer le projet

Depuis la racine:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api

## Scripts utiles

### Racine
- `npm run dev`
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run build`

### Backend
- `npm run dev`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`

### Frontend
- `npm run dev`
- `npm run build`
- `npm run lint`

## Endpoints API principaux

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Products
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`

### Orders
- `POST /api/orders`
- `GET /api/orders`

### Payments
- `POST /api/payments`
- `PATCH /api/payments/:id`

### Escrow
- `PATCH /api/escrow/release/:paymentId`

### Matching
- `GET /api/matching?country=CM&category=agro`

## Docker (bonus)

```bash
docker compose up --build
```

Ce fichier démarre PostgreSQL + backend.

## Contributeurs

- Lead Dev Fullstack (placeholder)
- Backend Dev (placeholder)
- Frontend Dev (placeholder)
- Product Dev (placeholder)
- QA/DevOps (placeholder)
