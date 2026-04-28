# Architecture CEMAC Connect

## Vision
CEMAC Connect suit une architecture monorepo fullstack pour faciliter la collaboration d'une équipe de 5 développeurs.

## Applications
- **frontend/** : Next.js (App Router) + Tailwind CSS.
- **backend/** : API REST Express TypeScript organisée par modules métier.

## Modules backend
- auth
- users
- products
- orders
- payments
- escrow
- matching

Chaque module possède `controller`, `service` et `routes`.

## Scalabilité
- séparation claire UI / API / DB
- Prisma ORM pour centraliser l'accès DB
- middlewares globaux pour auth et erreurs
