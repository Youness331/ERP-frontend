# ERP Frontend — Plateforme de Gestion des Opérations

Application **Angular 20** (standalone components, signals, zoneless) pour le back-office
de la plateforme ERP : clients, produits, stock, achats, ventes, devis, facturation,
rapprochement bancaire et rapports.

L'interface consomme l'API REST Laravel du dépôt [`ERP-backend`](../ERP-backend) :
`http://localhost:8000/api/v1`.

---

## Stack

| Élément | Choix |
| --- | --- |
| Framework | Angular 20 (standalone, signals, zoneless) |
| Langage | TypeScript 5.9 strict |
| Styles | SCSS |
| HTTP | `HttpClient` + intercepteurs fonctionnels |
| Auth | Token Sanctum (Bearer) stocké en `localStorage` |
| Tests | Karma + Jasmine (Chrome headless) |
| Build | `@angular/build` (esbuild) |

## Démarrage

Prérequis : Node ≥ 22.22 (ou 24.15) et l'API backend démarrée.

```bash
npm install
npm start          # http://localhost:4200
```

L'API doit tourner sur `http://localhost:8000` (CORS déjà autorisé pour `:4200`).
Pour changer d'URL, modifier `src/environments/environment.ts`.

Comptes de démonstration (créés par le backend) :

| Email | Rôle |
| --- | --- |
| `admin@erp.test` | Administrateur |
| `commercial@erp.test` | Commercial |
| `comptable@erp.test` | Comptable |
| `stock@erp.test` | Magasinier |

Mot de passe commun : `Password123!`

## Scripts

```bash
npm start                 # serveur de développement
npm run build             # build de production dans dist/
npm test                  # tests unitaires (watch)
npm test -- --watch=false # exécution unique (CI)
```

## Architecture

```
src/app/
├── core/                 # services transverses, sans dépendance UI
│   ├── auth/             # AuthService, stockage du token, guards
│   ├── http/             # intercepteurs (base URL, Bearer, erreurs)
│   └── models/           # types de l'API (Paginated, Client, ...)
├── layout/               # coquille applicative (barre latérale, en-tête)
├── features/             # écrans par domaine
│   ├── auth/             # page de connexion
│   ├── dashboard/        # tableau de bord
│   └── clients/          # liste + création de clients
├── app.config.ts         # providers globaux
└── app.routes.ts         # routes + guards
```

### Authentification

1. `POST /auth/login` renvoie un token et le profil avec ses `permissions[]`.
2. Le token est stocké par `TokenStorage` et ajouté à chaque requête par
   `authInterceptor` (qui préfixe aussi l'URL de base de l'API).
3. `authGuard` protège les routes ; `permissionGuard('clients.view')` vérifie un droit
   précis et redirige vers le tableau de bord sinon.
4. Une réponse `401` vide la session et renvoie vers `/login`.

Les menus et boutons s'appuient sur `AuthService.can('...')`, ce qui garde l'UI alignée
sur le RBAC du backend (58 permissions, 5 rôles).

## Convention de commits

`type(scope): sujet` — ex. `feat(auth): add token interceptor`.
Chaque fonctionnalité est développée sur sa propre branche puis fusionnée en `--no-ff`.
