# Guide Équipe Backend - CEMAC Connect

## Pourquoi respecter le contrat API

Le contrat API est la promesse entre backend, frontend et QA.
Si on casse un format, on casse les intégrations.

### Règles d'or

1. Ne jamais changer la structure standard de réponse.
2. Ne pas renommer un endpoint existant sans migration planifiée.
3. Ajouter une entrée de documentation pour chaque endpoint ajouté.

## Pourquoi respecter la structure de dossiers

La structure modulaire (`controller/service/routes`) sépare les responsabilités:
- controller: I/O HTTP
- service: logique métier
- routes: mapping URL

Cela facilite la relecture, les tests et le travail parallèle de 5 développeurs.

## Règles d'équipe avant Pull Request

1. Vérifier que le contrat API est à jour (`docs/api-contract.md`).
2. Vérifier que la doc API détaillée est à jour (`docs/api.md`).
3. Tester les endpoints modifiés avec Postman.
4. Exécuter build TypeScript backend sans erreur.

## Bonnes pratiques

- Pas de logique métier dans les controllers.
- Toujours valider les entrées minimales (champs requis).
- Gérer les erreurs avec des codes HTTP explicites.
- Préférer les noms clairs: `createOrder`, `updatePaymentStatus`.
- Ajouter `createdAt`/`updatedAt` sur tous les modèles Prisma.

## Checklist développeur backend

- [ ] Endpoint aligné avec le contrat API
- [ ] Service métier isolé dans `service.ts`
- [ ] Controller sans logique complexe
- [ ] Routes protégées avec JWT si nécessaire
- [ ] Prisma schema/migration à jour
- [ ] Documentation (`docs/api.md`) mise à jour
- [ ] Tests manuels Postman réalisés
- [ ] Build backend OK

## Commandes Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```
