# 🏦 ICT304 — Banking API v2

API REST de gestion bancaire (création de comptes, dépôts, retraits, transferts, suppression) construite avec Node.js et Express.

**Auteur :** NGANFANG KENGNI IDE MERVEILLE
**Matricule :** 22V2344

## 📁 Structure du projet

```
banking-api-v2/
├── index.js                          # Point d'entrée du serveur
├── package.json
└── src/
    ├── app.js                        # Configuration Express
    ├── swagger.js                    # Configuration Swagger
    ├── apiDocsPage.js                # Page HTML /api-docs
    ├── models/
    │   └── db.js                     # Base de données en mémoire
    ├── controllers/
    │   ├── accountsController.js     # Logique des comptes
    │   └── transactionsController.js # Logique des transactions
    ├── routes/
    │   └── accounts.routes.js        # Définition des routes
    ├── middlewares/
    │   └── validation.js             # Validation des données
    └── utils/
        └── helpers.js                # Fonctions utilitaires
```

## 🚀 Installation et lancement

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:3000`.

## 📋 Endpoints

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/v1/accounts` | Créer un compte |
| GET | `/api/v1/accounts` | Lister les comptes (pagination) |
| GET | `/api/v1/accounts/:id` | Détails d'un compte |
| DELETE | `/api/v1/accounts/:id` | Supprimer un compte (solde = 0) |
| POST | `/api/v1/accounts/:id/deposit` | Effectuer un dépôt |
| POST | `/api/v1/accounts/:id/withdraw` | Effectuer un retrait |
| POST | `/api/v1/accounts/:id/transfer` | Transfert vers un autre compte |
| GET | `/api/v1/accounts/:id/transactions` | Historique des transactions |
| GET | `/health` | Santé de l'API |
| GET | `/swagger` | Documentation Swagger interactive |
| GET | `/api-docs` | Page de documentation simple |

## 🧪 Exemple de test rapide

```bash
# Créer un compte
curl -X POST http://localhost:3000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -d '{"ownerName":"Alice","type":"CHECKING","initialBalance":1000}'

# Déposer de l'argent
curl -X POST http://localhost:3000/api/v1/accounts/{id}/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount":500}'
```

## ⚠️ Note

Les données sont stockées **en mémoire** : elles sont perdues à chaque redémarrage du serveur.
