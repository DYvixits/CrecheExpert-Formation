# Analyse approfondie — ConformiCrèche (CrecheExpert-Formation)

> Copilote réglementaire et orchestrateur de formations pour les structures de la petite enfance.
> Analyse fonctionnelle, technique et sécurité, complétée par une proposition de mise à niveau.

---

## 1. Résumé exécutif

ConformiCrèche est aujourd'hui un **prototype fonctionnel bien conçu visuellement** (UX soignée, design system cohérent, RBAC à 4 rôles) mais **architecturalement fragile** :

- 100 % de la logique (auth, permissions, calcul de score, accès aux données) s'exécute **côté client**, directement contre le SDK `@blinkdotnew/sdk`. Il n'existe **aucune couche API/backend propre au projet**.
- Le contrôle d'accès par rôle (`rbac.ts`, `RoleGuard`) ne fait que **masquer l'interface** — rien n'empêche, techniquement, un utilisateur authentifié d'appeler directement `blink.db.*` pour lire ou modifier les données d'un autre utilisateur ou d'une autre structure, tant que les règles serveur de la base Blink ne sont pas auditées séparément.
- Les documents de conformité (diplômes, attestations) sont stockés avec des **URLs publiques**, ce qui pose un problème de confidentialité pour des données à caractère personnel (RGPD).
- Le produit ne dispose d'**aucun test, aucune CI/CD, aucun lockfile committé**, ce qui rend toute évolution risquée.
- Le site charge en production un **script tiers de "auto-engineer"** (édition live du code par la plateforme Blink) — un vrai risque de surface d'attaque sur un produit destiné à des clients professionnels.

Le potentiel produit est réel (marché réglementaire petite enfance, échéance 2026, positionnement clair), mais **la version actuelle est un MVP de démonstration**, pas une base de production pour une SaaS gérant des données RH/réglementaires sensibles. La section 5 propose une feuille de route de mise à niveau.

---

## 2. Analyse des fonctionnalités

### 2.1 Cartographie du produit

| Module | Route | Rôle minimum | État |
|---|---|---|---|
| Landing / marketing | `/landing` | public | Complet visuellement, contenu statique |
| Authentification | géré par Blink (managed auth) | — | Login/signup délégués, pas de code applicatif visible |
| Tableau de bord | `/` | professional | Fonctionnel, données en grande partie **statiques/mockées** (formations en cours, alertes) |
| Diagnostic de conformité | `/diagnostic` | professional (`diagnostic:create`) | Fonctionnel, 4 questions seulement, scoring binaire simple |
| Catalogue de formations | `/catalog` | professional (`catalog:view`) | Fonctionnel, lecture seule, recherche/filtre basique |
| Coffre-fort documentaire | `/vault` | professional (`vault:view_own`) | Upload fonctionnel, mais fichiers **publics**, suppression non implémentée (bouton inactif) |
| Gestion d'équipe | `/team` | manager (`team:view`) — **non protégée au niveau route** | Ajout de membre factice (`temp_<timestamp>` au lieu d'une vraie invitation) |
| Paramètres | `/settings` | variable par onglet | Profil, structure (manager+), sécurité, rôles (admin) — bien structuré |
| Vérification e-mail | `/verify-email` | public | Fonctionnel via token Blink |

### 2.2 Points forts fonctionnels

- **RBAC à 4 niveaux** (`professional < trainer < manager < admin`) avec hiérarchie et permissions granulaires, bien pensé en apparence (`src/lib/rbac.ts`).
- **Parcours de diagnostic** en pas-à-pas, avec barre de progression, aide contextuelle par question, calcul de score et recommandations de remédiation par réponse — bonne base UX pour un outil réglementaire.
- **Coffre-fort documentaire** avec catégorisation (attestation, diplôme, PSC1, réglementaire) — répond à un vrai besoin des directions de crèche.
- **Vérification d'e-mail** et badge d'alerte si le compte n'est pas vérifié.

### 2.3 Lacunes fonctionnelles majeures

1. **Diagnostic très limité** : seulement 4 questions couvrant 3 catégories (`hygiene`, `safety`, `staffing`) alors que le modèle de données prévoit aussi `educational` et `administrative` — le "moteur de diagnostic adaptatif" promis par la landing page n'existe pas encore (pas de branchement conditionnel malgré le champ `dependsOn` prévu mais inutilisé).
2. **Aucune vraie invitation d'équipe** : `TeamPage.handleAddMember` crée un profil avec un `userId` généré côté client (`temp_${Date.now()}`) sans email, sans compte réel, sans lien avec l'authentification Blink — c'est un mock, pas une fonctionnalité d'invitation.
3. **Dashboard partiellement statique** : "Formations en cours : 3", "Alertes réglementaires : 2", taux de recyclage, etc. sont des **valeurs codées en dur**, pas des données réelles.
4. **Pas d'export** (PDF/Excel) des rapports de diagnostic ou du dossier de conformité pour un contrôle PMI — pourtant l'argument commercial central ("prêt pour les audits").
5. **Pas de suivi des échéances** réel (renouvellement PSC1 à 2 ans, expiration de diplômes) malgré le champ `expiryDate` déjà présent dans le modèle `ComplianceDoc` mais jamais utilisé/affiché.
6. **Catalogue en lecture seule** : pas d'inscription à une session, pas de suivi de progression, pas de lien réel vers CPF/OPCO malgré la promesse marketing.
7. **Suppression de documents non implémentée** (icône présente, aucun handler).
8. **Aucune notification** (email, in-app) pour les échéances, les nouvelles formations obligatoires ou les changements réglementaires.

---

## 3. Analyse technique

### 3.1 Stack

- **Frontend** : React 18/19 + TypeScript, Vite 7, TanStack Router + TanStack Query, Tailwind CSS + `tailwindcss-animate`, Framer Motion, Recharts, React Hook Form + Zod.
- **UI Kit** : `@blinkdotnew/ui` (design system propriétaire de la plateforme Blink) — cohérent visuellement mais **verrouillage fournisseur (vendor lock-in)** fort : composants métier (`Page`, `Stat`, `DataTable`, `AppShell`...) non réutilisables hors de l'écosystème Blink.
- **Backend/BaaS** : `@blinkdotnew/sdk` — auth managée, base de données (`blink.db.*`), stockage (`blink.storage.*`). **Aucun code serveur propre au projet** (pas de dossier `api/`, `server/`, de fonctions edge, de migrations SQL visibles dans ce dépôt).
- **Build/tooling** : ESLint, Stylelint, script maison de vérification des variables CSS Tailwind — bonne idée, mais lint pas branché à une CI.

### 3.2 Dette technique identifiée

| Constat | Fichier(s) | Impact |
|---|---|---|
| Reliquats du template Vite par défaut, jamais nettoyés | `src/main.ts`, `src/counter.ts`, `src/style.css`, `src/typescript.svg`, `src/App.css`, `public/vite.svg` | Poids mort, confusion pour les nouveaux contributeurs, `main.ts` n'est même pas chargé (c'est `main.tsx` qui est utilisé par `index.html`) |
| Aucun fichier de verrouillage des dépendances (`package-lock.json` / `bun.lockb` / `pnpm-lock.yaml`) committé | racine | Builds non reproductibles, risque de dérive de versions entre environnements |
| Aucun test (unitaire, intégration, e2e) | tout le repo | Aucune garantie de non-régression |
| Aucune CI/CD (`.github/workflows` absent) | — | Le lint/typecheck ne s'exécute qu'en local, à la discrétion du développeur |
| `<html lang="en">` alors que le contenu est 100 % français | `index.html` | Accessibilité (lecteurs d'écran) et SEO dégradés |
| `<title>Blink App</title>`, pas de meta description/OG | `index.html` | Branding et référencement quasi inexistants |
| Hack JSX pour éviter un import circulaire : `(import('./../../src/lib/rbac') as any, getPermissionsForRole(role))` | `src/pages/Settings.tsx:437` | Code fragile, expression bizarre qui n'a même pas d'effet réel (l'import est jeté), à remplacer par un appel direct à `getPermissions()` de `rbac.ts` |
| Duplication de la table de permissions (`ROLE_PERMISSIONS` dans `rbac.ts` **et** `getPermissionsForRole` dans `Settings.tsx`, avec des valeurs différentes — l'une utilise des wildcards `admin:*` qui n'existent pas dans le type `Permission`) | `src/lib/rbac.ts`, `src/pages/Settings.tsx` | Source de vérité divisée : un changement de permission dans `rbac.ts` ne se répercute pas dans l'écran d'admin |
| `window.location.reload()` après upload d'avatar au lieu d'une invalidation de state React | `src/pages/Settings.tsx:58` | UX dégradée (flash blanc, perte de scroll), contraire aux bonnes pratiques React Query déjà en place ailleurs |
| Score de conformité calculé et **persisté côté client** sans validation serveur | `src/pages/Diagnostic.tsx` | Un utilisateur pourrait falsifier son score de conformité en modifiant la requête réseau |
| `vite.config.ts` : `allowedHosts: true` | `vite.config.ts` | Acceptable en environnement de dev géré, dangereux si ce fichier de config sert aussi de base pour un déploiement de production |

### 3.3 Architecture actuelle (schéma logique)

```
Navigateur ── React SPA ──► @blinkdotnew/sdk ──► Backend Blink (managé, boîte noire)
                                                     ├─ Auth (managed mode)
                                                     ├─ DB (user_profiles, assessments,
                                                     │      assessment_responses, compliance_documents,
                                                     │      training_catalog, structures)
                                                     └─ Storage (fichiers avec URL publique)
```

Il n'y a **aucune couche intermédiaire** entre le navigateur et la base de données : c'est le modèle "BaaS direct", adapté à un prototype, mais **inadapté à une application métier multi-tenant gérant des données RH et réglementaires sensibles**, car toute la sécurité repose sur des règles configurées *ailleurs* (dans la console Blink, hors de ce dépôt) et invisibles/non versionnées ici.

---

## 4. Analyse de sécurité

### 4.1 Constats critiques

1. **Autorisation uniquement côté client (RBAC "cosmétique")**
   `rbac.ts`, `useAuth.can()` et `RoleGuard` ne font que conditionner le *rendu* de l'UI. Aucun de ces fichiers n'empêche un appel direct à `blink.db.user_profiles.list({...})`, `blink.db.compliance_documents.list({...})`, etc. avec des filtres arbitraires depuis la console du navigateur. Sans règles d'accès équivalentes appliquées **côté serveur/base**, n'importe quel compte "professional" authentifié peut potentiellement lire les documents ou les diagnostics d'autres utilisateurs/structures.
   → **Recommandation : traiter ceci comme la priorité n°1.**

2. **Route `/team` non protégée**
   Contrairement à l'onglet "Structure" des Paramètres (protégé par `<RoleGuard minRole="manager">`), la route `teamRoute` dans `App.tsx` n'a **aucun garde**. Seul l'élément de menu est masqué pour les rôles non autorisés — un utilisateur qui tape directement `/team` dans l'URL accède à la page (la donnée réelle dépendra ensuite des règles serveur, cf. point 1).

3. **Documents "coffre-fort" stockés avec URL publique**
   `blink.storage.upload(...)` renvoie un `publicUrl` utilisé tel quel comme `fileUrl`. Pour un coffre-fort censé contenir des diplômes et attestations nominatives (données personnelles), une URL publique et non expirante signifie que **toute personne possédant le lien peut consulter le document, sans authentification**. C'est un problème RGPD direct (minimisation/confidentialité des données personnelles, art. 32 RGPD — sécurité du traitement).

4. **Script tiers exécuté en production**
   `index.html` charge inconditionnellement `https://blink.new/auto-engineer.js?projectId=...`, un script d'édition/agent tiers, sur **toutes les pages, y compris pour les utilisateurs finaux en production**. Cela élargit la surface d'attaque (dépendance à la disponibilité et à l'intégrité d'un domaine tiers pour que l'app fonctionne et reste sûre) et n'a normalement sa place qu'en environnement d'édition/preview, pas en production client.

5. **Absence de validation des fichiers uploadés**
   Aucun contrôle de type MIME réel ni de taille côté client ou serveur visible pour les uploads (Vault et Avatar) — le champ `accept="image/png,image/jpeg,image/webp"` sur l'avatar est une simple suggestion HTML, contournable. Pas de scan antivirus/malware mentionné.

6. **Score et données d'auto-diagnostic non vérifiables**
   Le score de conformité est calculé en JS dans le navigateur puis inséré directement en base — un acteur malveillant pourrait forger un score de 100 % sans jamais avoir répondu aux questions.

7. **Fonctions de sécurité "vitrine"**
   Dans l'onglet "Sécurité" des Paramètres, les boutons "Changer le mot de passe" et "Journal d'audit" **n'ont pas de handler** — ils suggèrent des fonctionnalités de sécurité (rotation de mot de passe, traçabilité) qui n'existent pas encore, ce qui est trompeur pour un produit visant la conformité et l'audit.

8. **Gestion des secrets**
   `.env.local` n'est pas versionné (`*.local` est bien dans `.gitignore` — bon point), et la clé exposée (`VITE_BLINK_PUBLISHABLE_KEY`) est une clé *publique* par conception. Aucune fuite de secret détectée dans le dépôt actuel. Point positif à maintenir, mais à documenter (`*.env.example`) pour les futurs contributeurs.

### 4.2 Absences à combler (conformité & durcissement)

- Pas de 2FA/MFA pour les rôles `manager`/`admin` qui ont accès à des données RH sensibles.
- Pas de politique de mot de passe visible (déléguée à Blink Auth managé, à documenter/auditer).
- Pas de journal d'audit réel des actions sensibles (suppression de documents, changement de rôle, export de données).
- Pas de mécanisme de suppression/portabilité des données (droits RGPD : accès, rectification, effacement, portabilité).
- Pas de politique de rétention des documents (durée de conservation des diplômes/attestations après départ d'un salarié).
- Pas de Content Security Policy / en-têtes de sécurité HTTP documentés pour le déploiement.
- Pas de rate limiting visible sur les endpoints sensibles (délégué à Blink, à vérifier).

### 4.3 Points positifs à conserver

- `.gitignore` correct (`node_modules`, `*.local`, `dist`), aucun secret committé.
- Séparation claire des permissions par intention (`Permission` typé en TypeScript) — bonne base à *faire respecter côté serveur*.
- Vérification d'e-mail déjà implémentée avec état visible dans l'UI (badge, tooltip, page dédiée).
- Design des formulaires avec validation de champs requis avant activation des boutons.

---

## 5. Score de maturité (synthèse)

| Axe | Note /10 | Justification courte |
|---|---|---|
| Fonctionnalités | 5/10 | Bonne couverture des écrans clés, mais beaucoup de données mockées et de fonctions "vitrine" non branchées |
| Architecture technique | 4/10 | 100 % client-side, aucune couche serveur propre, fort vendor lock-in |
| Sécurité | 3/10 | RBAC non appliqué côté serveur (visible dans ce repo), stockage de documents sensibles en accès public, route non protégée |
| Stabilité/Qualité | 3/10 | Aucun test, aucune CI, aucun lockfile, dette de code (fichiers morts, duplication) |
| UX/UI | 7/10 | Design cohérent, moderne, bons états vides/chargement, responsive de base (breakpoints `md:`) |
| Accessibilité/SEO | 3/10 | `lang="en"` incorrect, pas de meta, titres/labels à vérifier avec un audit WCAG |
| Convivialité | 6/10 | Parcours guidé pour le diagnostic, mais pas d'onboarding, pas d'aide contextuelle globale |

**Score global indicatif : ~4,4/10** — un bon prototype de démonstration, à ne pas considérer comme prêt pour une mise en production commerciale gérant des données réelles de crèches.

---

## 6. Proposition d'amélioration et de mise à niveau

Objectif : transformer ConformiCrèche en une plateforme **plus large, plus efficace, plus stable, plus sécurisée et plus complète**, tout en restant **conviviale, confortable, intuitive et responsive**.

### 6.1 Priorité 0 — Sécurité (avant toute nouvelle fonctionnalité)

1. **Auditer et verrouiller les règles d'accès côté serveur** (règles Blink ou migration vers un backend propre) pour que chaque table (`user_profiles`, `assessments`, `compliance_documents`, `structures`) applique le RBAC *au niveau des données*, pas seulement de l'UI — filtrage systématique par `structureId`/`userId` et par rôle.
2. **Protéger toutes les routes sensibles** avec `RoleGuard` au niveau des routes elles-mêmes (`/team`, onglets admin), pas seulement au niveau du menu.
3. **Passer les documents du coffre-fort en stockage privé** avec URLs signées à durée de vie courte (ex. 5–15 min), générées à la demande de consultation, au lieu d'URLs publiques permanentes.
4. **Retirer le script `auto-engineer.js` de la build de production** (le conditionner à l'environnement d'édition uniquement).
5. **Valider les uploads côté serveur** (type MIME réel, taille max, scan antivirus) en plus des contrôles côté client.
6. **Faire calculer/valider le score de diagnostic côté serveur** à partir des réponses brutes, jamais faire confiance à un score envoyé par le client.
7. **Mettre en œuvre le volet RGPD** : page de gestion des consentements, export des données personnelles, suppression de compte, durée de rétention documentée pour les pièces RH.

### 6.2 Priorité 1 — Stabilité & qualité d'ingénierie

- Committer un lockfile (`bun.lockb` ou `package-lock.json`) et figer les versions critiques.
- Mettre en place une **CI GitHub Actions** : `lint`, `typecheck`, `build`, puis `test` dès que la base de tests existe.
- Ajouter des **tests unitaires** (RBAC, calcul de score, formulaires) avec Vitest + Testing Library, et des **tests e2e** (Playwright) sur les parcours critiques (diagnostic complet, upload de document, gestion d'équipe).
- Nettoyer les résidus du template Vite (`main.ts`, `counter.ts`, `style.css`, `App.css`, `typescript.svg`, `vite.svg`) non utilisés par l'app réelle.
- Unifier la source de vérité des permissions (supprimer la duplication `Settings.tsx` / `rbac.ts`) et supprimer le hack d'import circulaire.
- Ajouter un système de gestion d'erreurs global (error boundary React, monitoring type Sentry) et un logging structuré.
- Ajouter un monitoring de performance et d'erreurs en production (Sentry, ou équivalent), avec alerting.

### 6.3 Priorité 2 — Fonctionnalités élargies (produit "plus complet")

- **Diagnostic adaptatif réel** : exploiter le champ `dependsOn` déjà prévu, enrichir les 4 questions actuelles vers un référentiel complet par catégorie (hygiène, sécurité, RH, pédagogie, administratif), pondération par gravité réglementaire, historique des diagnostics dans le temps (courbe de progression).
- **Suivi des échéances réel** : exploiter `expiryDate` pour générer automatiquement les "Alertes réglementaires" (recyclage PSC1 à 2 ans, renouvellement de diplômes, agréments PMI), avec notifications email/in-app avant échéance.
- **Invitations d'équipe fonctionnelles** : envoi d'un e-mail d'invitation avec lien d'inscription sécurisé, au lieu de créer un `userId` factice côté client ; suivi du statut d'invitation (en attente / acceptée).
- **Export de rapports** : génération PDF du rapport de diagnostic et du dossier de conformité, prêt à présenter lors d'un contrôle PMI.
- **Catalogue actionnable** : inscription réelle à une session, suivi de progression individuel, intégration effective CPF/OPCO (ou à défaut liens de redirection contractualisés), notation des organismes.
- **Tableau de bord dynamique** : remplacer les statistiques codées en dur par des agrégations réelles (formations en cours, échéances à J-30, taux de conformité par catégorie).
- **Gestion multi-structures** pour les groupes/réseaux de crèches (un manager pilotant plusieurs établissements), avec agrégation et comparatif inter-structures.
- **Journal d'audit réel** consultable par les admins (connexions, modifications de rôle, suppressions de documents).

### 6.4 Priorité 3 — Convivialité, confort, intuitivité et responsive

- **Onboarding guidé** à la première connexion (assistant en 3–4 étapes : structure → équipe → premier diagnostic).
- **Aide contextuelle** (tooltips réglementaires déjà amorcés dans le diagnostic, à généraliser : liens vers les textes de loi, glossaire petite enfance).
- **Accessibilité** : corriger `lang="fr"`, ajouter des `aria-label` sur les icônes-boutons (suppression, édition), vérifier les contrastes, navigation clavier complète, conformité WCAG 2.2 AA.
- **Responsive avancé** : les bases sont là (`md:hidden`, grilles adaptatives), mais à tester systématiquement sur mobile pour les tableaux (`DataTable`) qui sont peu lisibles en petit écran — prévoir des vues "carte" empilées en mobile pour Vault/Team/Catalog.
- **Mode hors-ligne / PWA** pour la consultation du coffre-fort en cas de contrôle sur site sans connexion fiable.
- **Notifications in-app centralisées** (cloche de notification) pour échéances, invitations, mises à jour réglementaires.
- **SEO/branding** : titre et meta description dynamiques par page, Open Graph pour le partage, favicon et identité de marque cohérente avec "ConformiCrèche" (actuellement encore "Blink App" dans le `<title>`).

### 6.5 Vision architecture cible (moyen terme)

```
Navigateur (SPA React, responsive, PWA)
        │
        ▼
API applicative dédiée (BFF : Node/Express, Fastify, ou fonctions serverless)
        │  ── Authentification & sessions
        │  ── Application STRICTE du RBAC par requête (pas seulement à l'affichage)
        │  ── Validation métier (scores, échéances, quotas)
        │  ── Génération d'URLs signées pour le stockage
        │
        ▼
Base de données (Postgres géré ou service actuel Blink, mais avec règles
d'accès versionnées et testées) + Stockage privé avec URLs signées
        │
        ▼
Services annexes : emailing transactionnel (invitations, échéances),
génération PDF, file de notifications, observabilité (Sentry, logs), CI/CD
```

Cette cible permet de conserver l'expérience React/Blink actuelle côté UI tout en **reprenant le contrôle de la sécurité et de la logique métier**, condition nécessaire pour vendre ce produit à des structures gérant des données RH et réglementaires réelles.

### 6.6 Feuille de route indicative

| Phase | Contenu | Objectif |
|---|---|---|
| **Phase 0 (immédiat)** | Sécurité critique (§6.1) : RLS/règles serveur, garde de route `/team`, stockage privé, retrait du script tiers en prod | Rendre le produit "sûr par défaut" |
| **Phase 1 (1–2 sprints)** | Qualité d'ingénierie (§6.2) : lockfile, CI, tests de base, nettoyage de dette | Rendre le produit stable et maintenable |
| **Phase 2 (1–2 mois)** | Fonctionnalités cœur (§6.3) : diagnostic enrichi, échéances réelles, invitations réelles, exports PDF | Rendre le produit réellement utile en conditions réelles |
| **Phase 3 (continu)** | UX/accessibilité/responsive/PWA (§6.4) | Rendre le produit agréable et inclusif à grande échelle |
| **Phase 4** | Architecture cible avec BFF (§6.5) | Passer d'un prototype BaaS à une plateforme SaaS robuste et scalable |

---

## 7. Conclusion

ConformiCrèche possède un **positionnement produit clair et un habillage UX de qualité**, mais dans son état actuel, c'est **un démonstrateur** : la sécurité repose presque entièrement sur des éléments non visibles/non versionnés dans ce dépôt, plusieurs fonctionnalités affichées sont en réalité des mocks, et l'absence totale de tests/CI rend toute évolution risquée. La priorité absolue avant toute nouvelle fonctionnalité doit être de **sécuriser l'accès aux données** (RBAC serveur, stockage privé) et de **poser un socle d'ingénierie** (tests, CI, nettoyage), avant d'élargir le produit vers la plateforme plus complète décrite en section 6.
