# Intégration paiement mobile — Orange Money & MTN MoMo

Date : 2026-07-10
Statut : décision produit actée, intégration technique **non commencée**. Ce document sert de référence unique pour Backend-01/Zai (intégration API) et Claude2/Design-01 (composants visuels dédiés).

Contexte : `PaymentPanel.tsx` simule aujourd'hui le paiement Mobile Money (voir `docs/ISSUES-LOG.md`, entrée 2026-07-10 — le flux appelle `PaymentController::processMobileMoney`, un endpoint de simulation conservé pour les tests). Ce document prépare le passage à de vraies intégrations opérateur.

---

## 1. Orange Money — API retenue

**Portail** : https://apiis.orange.cm/store/ (WSO2 API Store, nécessite inscription développeur + souscription à l'application pour obtenir un token).

**API** : `OrangeMoneyCoreAPIS` v1.0.2, éditée par Orange Money (provider `bmhb8456`), statut `PUBLISHED`.

**Base URL** (production et sandbox — à priori le même host, à confirmer une fois l'inscription faite) :
```
https://api-s1.orange.cm/omcoreapis/1.0.2
http://api-s1.orange.cm/omcoreapis/1.0.2   (aussi exposé en clair, à éviter)
```

**Contact technique Orange (Software Factory)** : DSI.Software_Factory@orange.com
**Contact business** : marketing.omeneyocm@orange.com

### 1.1 Authentification

Deux mécanismes exposés par le swagger :
- **OAuth2 implicit flow** — `authorizationUrl: https://api-s1.orange.cm/authorize`
- **Bearer token** en header `Authorization`
- **ApiKeyAuth** alternatif — header `X-AUTH-TOKEN: base64(username:password)`

→ **Zai/Backend-01** : à valider lequel des deux est réellement utilisable en usage serveur-à-serveur (le flow `implicit` est normalement pensé pour un contexte navigateur avec redirection utilisateur, donc probablement non pertinent pour un appel backend Laravel — privilégier `X-AUTH-TOKEN` ou un flow `client_credentials` si le portail en propose un après inscription). Nécessite un compte développeur + une "Application" créée sur le portail pour obtenir les identifiants (non fait à ce jour).

### 1.2 Flux pertinent pour C-Connect : "Merchant Payment" (mp)

C-Connect est un marchand qui encaisse un acheteur → c'est le flux `mp` (Merchant Payment) du swagger, pas `c2c` (transfert particulier-à-particulier) ni `cashin`/`cashout` (opérations agent).

| Étape | Endpoint | Méthode | Rôle |
|---|---|---|---|
| 1. Initier | `/mp/init` | POST | Crée la transaction, retourne un `payToken` |
| 2. Déclencher le prompt PIN sur le téléphone du client | `/mp/push/{payToken}` | GET | Envoie la demande de confirmation au client |
| 3. Traiter le paiement | `/mp/pay` | POST | Exécute le paiement avec le `payToken` (voir corps ci-dessous) |
| 4. Vérifier le statut | `/mp/paymentstatus/{payToken}` | GET | Poll ou vérification finale — **c'est cet appel qui doit remplacer le `PaymentController::processMobileMoney` de simulation actuel** |

**Corps de `/mp/pay`** (`mpPayRequestBody`) :
```json
{
  "notifUrl": "https://.../webhooks/payments/orange",
  "channelUserMsisdn": "numéro du marchand (compte C-Connect Orange Money)",
  "amount": 12345,
  "subscriberMsisdn": "numéro du client payeur",
  "pin": "code PIN — rôle exact à clarifier, voir §1.3",
  "orderId": "identifiant de la commande C-Connect, max 20 caractères",
  "description": "libellé, max 125 caractères",
  "payToken": "obtenu à l'étape /mp/init"
}
```
Note : `notifUrl` est documenté par Orange comme utilisant le port 80.

**Réponse** (`mp` schema) inclut notamment : `inittxnstatus`/`inittxnmessage` (statut à l'initiation, `200` = succès), `confirmtxnstatus`/`confirmtxnmessage` (statut une fois le client confirmé côté téléphone), `txnid` (identifiant Orange), `status`.

### 1.3 Points à clarifier avant implémentation (Zai)

- **`notifUrl` exige le port 80** selon la doc swagger — à vérifier si ça s'applique tel quel à notre infra (souvent https/443 uniquement en prod). Si contrainte réelle, prévoir un endpoint webhook dédié en HTTP simple ou un proxy.
- Le champ `pin` dans `/mp/pay` : le swagger ne précise pas explicitement si c'est le PIN du marchand (C-Connect) ou celui du client final. Vu le flux (`/mp/push` sert justement à demander la confirmation PIN **au client** sur son téléphone), il est probable que `/mp/pay` ne doive pas recevoir le PIN du client en clair côté serveur — à vérifier absolument avec le support Orange avant tout envoi de PIN utilisateur depuis notre backend (risque de sécurité/conformité si mal compris).
- `orderId` limité à 20 caractères — compatible avec nos IDs `bigIncrements`, mais à garder en tête si un préfixe est ajouté (ex. `CC-000123`).
- Pas de documentation utilisateur (`Documents`) publiée sur le portail au-delà du swagger — toute question de flux doit passer par le contact technique Orange ci-dessus.

---

## 2. MTN Mobile Money

**Statut : non recherché.** Décision produit : "on verra au fur et à mesure". Aucune API MTN identifiée ni contactée à ce jour. Le sélecteur de méthode de paiement (`PaymentPanel.tsx`) continue d'afficher MTN MoMo comme option dans l'UI (cohérence visuelle avec Orange), mais **le flux MTN reste sur la simulation actuelle jusqu'à nouvel ordre** — ne pas basculer MTN vers un vrai appel API sans qu'une intégration équivalente à la §1 soit documentée ici.

---

## 3. Composants visuels & animations dédiés (Claude2 / Design-01)

Demande explicite : le sélecteur de moyen de paiement et les étapes de confirmation doivent avoir une identité visuelle propre à chaque opérateur, pas un composant générique interchangeable.

État actuel (`components/checkout/PaymentPanel.tsx`) : `MethodCard` générique, une seule icône `Smartphone` (lucide) recolorée par variable CSS selon l'opérateur (jaune MTN / orange Orange Money), pas de logo officiel, pas d'animation propre à la marque.

À concevoir (backlog, non commencé) :
- Logos officiels MTN MoMo / Orange Money (obtenir les assets de marque via les contacts ci-dessus ou kits presse officiels — **ne pas improviser un logo approximatif**, question de crédibilité et potentiellement de droits d'usage de marque).
- Micro-animation dédiée à l'étape `pending_pin` (actuellement un simple spinner générique `Loader2`) — idée : animation évoquant un téléphone qui reçoit une notification, dans l'esprit visuel de chaque opérateur (couleurs de marque respectées), sans surcharger ni ralentir le flux.
- Transition d'état plus marquée entre `phone` → `pending_pin` → `success` dans `StatusTracker` (actuellement fonctionnel mais sobre).
- Conserver impérativement la sobriété du flux : le paiement est un moment de tension pour l'utilisateur, toute animation doit rassurer, jamais distraire ni ralentir la confirmation.

---

## 4. Prochaines étapes

1. **Zai/Backend-01** : inscription sur https://apiis.orange.cm/store/, création d'une Application, souscription à `OrangeMoneyCoreAPIS`, obtention des identifiants sandbox.
2. **Zai/Backend-01** : lever les points d'ambiguïté §1.3 avec le support Orange avant d'écrire le moindre code d'intégration (notamment la question du PIN).
3. **Backend-01** : une fois validé, remplacer `PaymentController::processMobileMoney` par un vrai appel `/mp/init` → `/mp/push` → `/mp/pay` → poll `/mp/paymentstatus`, en conservant la même forme de réponse attendue par `PaymentPanel.tsx` pour ne pas casser le frontend.
4. **Claude2/Design-01** : dès les assets de marque obtenus, remplacer `MethodCard` générique par les composants dédiés décrits en §3.
5. **MTN** : à traiter dans un futur cycle — ce document sera mis à jour dès qu'une décision est prise.
