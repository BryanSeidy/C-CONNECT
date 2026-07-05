# ORGANISATION DE L'ÉQUIPE

## 🧑‍💻 @Geraldine  : *Frontend Dashboard & UX* (Espace Client/Vendeur & Checkout)

Ton rôle est de créer l'interface connectée où les transactions se finalisent et où la gamification prend vie visuellement.

🛠️ *SPRINT 1* : *Auth UI & Gestion d'État*
(Semaine 1)

☐ Configurer Zustand pour la gestion globale de l'état de l'application (Stockage du panier localement et état d'authentification)
☐ Configurer React Query (TanStack Query) pour la mise en cache des requêtes API afin de parer aux micro-coupures internet
☐ Développer les interfaces des formulaires de Connexion et d'Inscription

🛍️ *SPRINT 2* : *Espace Vendeur & Gestion Commerciale*
(Semaine 1)

☐ Développer le tableau de bord du Vendeur : Formulaire d'ajout de produit, suivi des stocks et liste des commandes reçues
☐ Créer l'interface du profil de l'Acheteur : Historique des commandes passées et gestion des produits favoris

💳 *SPRINT 3* : *Tunnel d'Achat, Escrow UI & Gamification*
(Semaine 2)

☐ Développer la page de validation de commande (Checkout) avec le choix du mode de paiement (MTN MoMo / Orange Money).
☐ Concevoir l'interface visuelle claire du fonctionnement de l'Escrow pour rassurer l'acheteur (Indicateur d'étape : Argent bloqué -> En cours d'expédition -> Reçu)
☐ Créer les interfaces de la Gamification : Affichage du solde de points, barre de progression des niveaux et affichage des badges débloqués sur les profils
☐ Implémenter les "Mises à jour optimistes" (Optimistic Updates) avec React Query sur les boutons d'action (Favoris, avis)

🚀 *SPRINT 4* : *Recette & UI Testing*
(Semaine 2)

☐ Effectuer la phase de Recette Utilisateur (QA UI) : tester le parcours complet d'achat sur différents interfaces (smartphones / web) pour corriger les bugs d'affichage.

## 🧑‍💻 @Synthia  : *Backend Métier* (Catalogue & Commandes)

Ton rôle est de coder toute la logique commerciale de la marketplace
(Produits, Catégories, Stock)

🛠️ *SPRINT 1* : *Modélisation des Données*
(Semaine 1)

☐ Créer la migration et le modèle pour la table seller_profiles
(inclure les champs spécifiques : is_female_owned, is_local_producer, region)
☐ Créer la migration et le modèle pour la table categories
☐ Créer la migration et le modèle pour la table products
☐ Définir les relations Eloquent dans Laravel
(User hasOne SellerProfile, SellerProfile hasMany Product)

🛍️ *SPRINT 2* : *API Commerce & Multi-Vendor*
(Semaine 1)

☐ Développer le CRUD complet pour la gestion des produits par les vendeurs
(Ajout, Modification, Suppression, Gestion du stock)
☐ Développer les endpoints de consultation publique : Liste des produits, Filtrage par région, par catégorie, et filtres d'impact
(Femmes/Producteurs)
☐ Développer l'API du panier d'achat et de la création d'une commande initiale au statut pending

💳 *SPRINT 3* : *Backoffice & Validation*
(Semaine 3)

☐ Développer les routes de modération pour l'administrateur
(Validation d'un nouveau vendeur, blocage de produits signalés)
☐ Intégrer le système de notation et de commentaires
(avis clients sur les produits locaux)

🚀 *SPRINT 4* : *Optimisation & Fixes*
(Semaine 4)

☐ Écrire les tests unitaires sur le calcul des prix, des paniers et la réduction des stocks
☐ Mettre en cache les endpoints des catégories et des filtres de régions pour soulager la base de données

## 🧑‍💻 @Gift : *Frontend Marketplace* (Vitrine & SEO Next.js)

Ton rôle est de concevoir une vitrine publique ultra-rapide, ergonomique et optimisée pour Google (Cameroun)

🛠️ *SPRINT 1* : *Design System & Structure*
(Semaine 1)

☐ Configurer le Design System visuel
(Couleurs locales, typographies, boutons, cartes de produits)
☐ Créer les composants structurels globaux : Barre de navigation, Pied de page, Mise en page globale (Layouts)

🛍️ *SPRINT 2* : *Storefront Dynamique*
(Semaine 2)

☐ Développer la page d'accueil avec les bannières de mise en avant du "Made in Cameroon"
☐ Créer la page catalogue avec l'affichage dynamique des produits récupérés depuis l'API Laravel
☐ Implémenter les filtres de recherche par catégorie, région, et les filtres exclusifs
(Entreprises féminines / Producteurs locaux)
☐ Concevoir la page de détail d'un produit en utilisant le rendu ISR (Incremental Static Regeneration) pour un affichage instantané

💳 *SPRINT 3* : *Optimisation Low-Data & Images*
(Semaine 2)

☐ Intégrer et configurer le composant [Image] de Next.js pour forcer le redimensionnement et la conversion automatique des visuels au format WebP
☐ Intégrer l'état du réseau (navigator.onLine) pour afficher le bandeau d'avertissement non-intrusif en cas de connexion internet instable.

🚀 *SPRINT 4* : *SEO & Déploiement*
(Semaine 2)

☐ Configurer les balises Meta SEO dynamiques (OpenGraph, sitemap.xml, robots.txt) pour chaque produit et vendeur afin de maximiser le trafic organique
☐ Déployer l'application frontend Next.js sur la plateforme Vercel

## 🧑‍💻 @Simo *Backend Paiement & Gamification* (intégrer MoMo/Orange Money)

🛠️ *SPRINT 1* : *Base de la Gamification*
(Semaine 1)

☐ Créer la migration et le modèle pour la table gamification_stats
(points, total_sales, quality_rating, badges_unlocked en JSON)
☐ Développer les Events & Listeners de base dans Laravel pour écouter les actions utilisateurs

🛍️ *SPRINT 2* : *Moteur de Points & Badges*
(Semaine 1)

☐ Coder la logique d'attribution automatique des points pour les acheteurs
(Avis publié, commande passée)
☐ Coder la logique d'attribution automatique des points et badges pour les vendeurs
(is_female_owned -> Badge "Woman Pioneer")
☐ Créer l'endpoint API permettant de récupérer le statut de gamification et les badges d'un utilisateur donné

💳 *SPRINT 3* : *Intégration Mobile Money & Escrow*
(Semaine 2)

☐ Intégrer l'API de l'agrégateur de paiement
(Campay, Notch Pay, ou similaire) pour MTN MoMo et Orange Money
☐ Développer l'endpoint de Webhook sécurisé pour recevoir la confirmation de paiement en temps réel de l'opérateur
☐ Coder l'action de l'Escrow : Au webhook positif, l'argent passe au statut escrow_locked et une notification de préparation de commande est générée
☐ Créer le déclencheur de libération des fonds : Lorsque le client ou le livreur valide la réception, le statut passe à released

🚀 *SPRINT 4* : *Tests Réseau & Notifications*
(Semaine 2)

☐ Mettre en place l'envoi de notifications par WhatsApp/SMS automatisés lors du verrouillage et de la libération de l'Escrow
☐ Effectuer des tests de charge et des simulations de pannes réseau sur le webhook de paiement pour s'assurer qu'aucune transaction ne s'égare

## 🧑‍💻 @Assom : *Lead Backend* (Auth, Sécurité & Core)

Ton rôle est de monter les fondations de l'API Laravel et de garantir qu'aucun autre développeur ne soit bloqué

🛠️ *SPRINT 1* : Fondations & Sécurité
(Semaine 1)

✅ Initialiser le projet Laravel 12+ et configurer la base de données PostgreSQL
✅ Installer et configurer Laravel Sanctum pour l'authentification API des applications SPA
☐ Créer les migrations et modèles pour les tables users et roles
☐ Mettre en place le système de contrôle d'accès basé sur les rôles (RBAC) : Acheteur, Vendeur, Admin
☐ Développer les endpoints d'API pour : Inscription, Connexion, Déconnexion et Récupération du profil
☐ Rédiger les scripts de Seeders pour générer des données de test (comptes fictifs)

🛍️ *SPRINT 2* : *Support Métier*
(Semaine 1)

☐ Créer les politiques de sécurité (Policies) pour restreindre l'accès aux dashboards vendeurs
☐ Optimiser les requêtes API (Eager Loading) pour éviter le problème de performance N+1 sur le catalogue.Configurer le système de stockage des fichiers
(liaison Laravel vers le stockage local/cloud pour les images produits)

💳 *SPRINT 3* : Escrow & Queues
(Semaine 2)

☐ Créer la logique de séquestre de l'Escrow dans l'historique des commandes (statuts: pending, escrow_locked, released, disputed)
☐ Configurer les Queue Jobs (files d'attente Laravel) de base de données pour l'envoi asynchrone des e-mails et SMS

🚀 *SPRINT 4* : *Finalisation & Déploiement*
(Semaine 2)

☐ Effectuer l'audit de sécurité des endpoints API
(protection contre les injections et failles d'authentification)
☐ Déployer l'API Laravel sur le serveur VPS Linux
(Nginx, PHP-FPM, SSL Let's Encrypt)
