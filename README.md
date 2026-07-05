<div align="center">

# 🇨🇲 C-Connect (Cameroon-Connect)

### **La Marketplace Nationale du Made in Cameroon**

### *Connecter • Valoriser • Commercialiser*

<img src="./docs/assets/logo.png" alt="C-Connect Logo" width="180"/>

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)]()
[![Laravel](https://img.shields.io/badge/Laravel-12-red?logo=laravel)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?logo=postgresql)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()
[![Status](https://img.shields.io/badge/Status-In%20Development-orange)]()

---

### **Construisons ensemble la référence du Made in Cameroon 🇨🇲**

</div>

---

# 📖 Présentation

**C-Connect (Cameroon-Connect)** est une marketplace numérique nationale destinée à promouvoir, valoriser et commercialiser les produits **Made in Cameroon**.

La plateforme connecte directement les producteurs locaux, artisans, coopératives, PME et entreprises dirigées par des femmes avec les consommateurs camerounais au sein d'un environnement moderne, sécurisé et performant.

Au-delà d'une simple plateforme e-commerce, **C-Connect** constitue un véritable écosystème numérique visant à accélérer la transformation du commerce local, renforcer la souveraineté économique et soutenir les objectifs de la **Stratégie Nationale de Développement (SND30)**.

---

# 🎯 Vision

Faire de **C-Connect** la plateforme nationale de référence dédiée au **Made in Cameroon**, en créant un écosystème numérique favorisant la consommation locale, la confiance, l'innovation et l'inclusion économique.

---

# 🚀 Objectifs

- 🇨🇲 Promouvoir les produits Made in Cameroon
- 👩🏾 Valoriser les femmes entrepreneures
- 🌱 Soutenir les producteurs locaux
- 🛒 Digitaliser le commerce national
- 💳 Faciliter les paiements Mobile Money
- 🤝 Renforcer la confiance entre acheteurs et vendeurs
- 🏆 Encourager la qualité grâce à la gamification
- 📈 Développer une économie numérique durable

---

# ✨ Fonctionnalités Principales

## 👤 Authentification

- Inscription
- Connexion
- Gestion des profils
- Authentification sécurisée via Laravel Sanctum

---

## 🛍 Marketplace

- Catalogue produits
- Recherche intelligente
- Filtres avancés
- Produits populaires
- Produits recommandés
- Gestion des catégories
- Gestion des régions

---

## 🏪 Boutique Vendeur

- Création de boutique
- Gestion du catalogue
- Gestion des commandes
- Gestion des stocks
- Tableau de bord
- Statistiques

---

## 🛒 Gestion des commandes

- Panier
- Paiement
- Historique
- Suivi
- Livraison

---

## 💳 Paiements

- MTN Mobile Money
- Orange Money
- Webhooks
- Vérification automatique
- Historique des transactions

---

## 🔒 Escrow (Séquestre)

Les paiements sont temporairement sécurisés jusqu'à confirmation de la livraison.

Cette approche protège simultanément :

- les acheteurs
- les vendeurs

---

## 🏅 Gamification

Le système de gamification constitue l'un des principaux facteurs de différenciation de la plateforme.

Il permet :

- l'attribution de points
- des badges
- des niveaux
- des récompenses
- des indicateurs de confiance

Exemples :

- 🏅 Woman Pioneer
- 🇨🇲 Made in Cameroon
- ⭐ Quality Star
- 🏆 Camer Champion

---

## ⭐ Avis & Notations

- Avis clients
- Notes
- Historique qualité
- Réputation vendeur

---

# 🌍 Impact

C-Connect favorise :

- la consommation locale
- la création de richesse
- l'inclusion numérique
- l'autonomisation des femmes
- l'import-substitution
- le développement des PME
- la transformation numérique du commerce camerounais

---

# 🏗 Architecture

```
                        INTERNET
                             │
                             │
                     Next.js Frontend
               (SSR • SEO • TypeScript)
                             │
                    REST API HTTPS
                             │
                     Laravel Backend
        (Business Logic • Auth • Payments)
                             │
                  PostgreSQL Database
                             │
 ┌──────────────────┬────────────────────┐
 │                  │                    │
 │                  │                    │
 ▼                  ▼                    ▼
Storage        Mobile Money         Notifications
(S3)        MTN & Orange Money     SMS / WhatsApp
```

---

# 🛠 Stack Technique

## Frontend

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- React Query
- Zustand
- Axios
- React Hook Form
- Zod

---

## Backend

- Laravel 12
- PHP 8.4
- Sanctum
- Eloquent ORM
- Queues
- Events
- Policies
- Notifications

---

## Base de données

- PostgreSQL

---

## DevOps

- Docker
- GitHub Actions
- Nginx
- VPS Linux
- Let's Encrypt

---

# 📂 Structure du Projet

```
C-CONNECT

├── frontend/
│
├── backend/
│
├── docs/
│
├── design/
│
├── api/
│
├── database/
│
├── docker/
│
└── README.md
```

---

# 📂 Frontend

```
frontend

src
│
├── app
├── components
├── features
├── hooks
├── lib
├── services
├── store
├── styles
├── types
└── utils
```

---

# 📂 Backend

```
backend

app
│
├── Actions
├── DTO
├── Events
├── Exceptions
├── Http
├── Listeners
├── Models
├── Notifications
├── Policies
├── Repositories
├── Services
└── Traits
```

---

# ⚙ Installation

## 1. Cloner le projet

```bash
git clone https://github.com/c-connect/cconnect.git
```

---

## 2. Backend

```bash
cd backend

composer install

cp .env.example .env

php artisan key:generate

php artisan migrate

php artisan serve
```

---

## 3. Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔐 Variables d'environnement

Backend

```env
APP_NAME=CConnect

APP_ENV=local

APP_URL=http://localhost:8000

DB_CONNECTION=pgsql

DB_DATABASE=cconnect

DB_USERNAME=postgres

DB_PASSWORD=password

PAYMENT_PROVIDER=campay
```

Frontend

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

# 🌱 Git Workflow

Le projet suit une stratégie Git inspirée de **Git Flow**.

```
main
│
develop
│
├── feature/auth
├── feature/products
├── feature/orders
├── feature/payments
├── feature/gamification
├── feature/dashboard
└── feature/search
```

---

# 📝 Convention des commits

Nous utilisons **Conventional Commits**.

Exemples :

```bash
feat(auth): login with sanctum

fix(products): stock issue

refactor(api): optimize products endpoint

docs(readme): update installation

style(ui): improve navbar

test(auth): add login tests
```

---

# 🚦 Roadmap

## Sprint 1

- Authentification
- Utilisateurs
- Produits
- Catégories
- Architecture

---

## Sprint 2

- Marketplace
- Dashboard vendeur
- Dashboard acheteur
- Recherche
- SEO

---

## Sprint 3

- Paiements
- Escrow
- Gamification
- Notifications

---

## Sprint 4

- Optimisations
- Tests
- Déploiement
- Monitoring
- Production

---

# 🤝 Contribution

1. Fork
2. Créer une branche

```bash
git checkout -b feature/ma-feature
```

3. Commit

```bash
git commit -m "feat(module): description"
```

4. Push

```bash
git push origin feature/ma-feature
```

5. Pull Request

---

# 👥 Équipe

| Rôle | Responsabilité |
|--------|----------------|
| CTO / Product Owner | Architecture, vision, coordination |
| Backend Developer | API, logique métier |
| Backend Developer | Paiements & Gamification |
| Frontend Developer | Marketplace |
| Frontend Developer | Dashboards & UX |

---

# 📌 Objectifs à court terme

- MVP fonctionnel en **30 jours**
- Déploiement Production
- Première vague de vendeurs
- Première campagne Made in Cameroon

---

# 🔮 Perspectives

Après le MVP :

- Application Mobile
- Livraison intégrée
- Intelligence Artificielle
- Programme Ambassadeurs
- Statistiques avancées
- Commerce B2B
- Extension CEMAC

---

# 📜 Licence

Ce projet est distribué sous licence **MIT**.

---

# ❤️ Remerciements

Nous remercions l'ensemble des producteurs, artisans, coopératives, femmes entrepreneures et partenaires qui contribuent chaque jour au développement de l'économie camerounaise.

---

<div align="center">

## 🇨🇲 C-Connect

### **Parce que chaque achat local construit l'économie de demain.**

**Made with ❤️ in Cameroon**

</div>
