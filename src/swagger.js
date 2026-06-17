// ══════════════════════════════════════════════════════════════════
//  SWAGGER — Configuration de la documentation API
// ══════════════════════════════════════════════════════════════════

const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ICT304 — API Bancaire Multibanque',
      version: '2.0.0',
      description:
        '**Système de Transaction Bancaire Mobile**\n\n' +
        '👤 **Auteur :** NGANFANG KENGNI IDE MERVEILLE\n\n' +
        '🎓 **Matricule :** 22V2344',
    },
    servers: [
      { url: 'https://ict-304-opij.onrender.com', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Local' },
    ],
    tags: [
      { name: 'Comptes', description: 'Gestion des comptes bancaires' },
      { name: 'Transactions', description: 'Dépôts, retraits, transferts et historique' },
    ],
    components: {
      schemas: {
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-xxxx' },
            accountNumber: { type: 'string', example: 'BNK-12345678' },
            ownerName: { type: 'string', example: 'Alice Dupont' },
            type: { type: 'string', enum: ['CHECKING', 'SAVINGS'] },
            balance: { type: 'number', example: 1000.0 },
            currency: { type: 'string', example: 'EUR' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            accountId: { type: 'string' },
            type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
            amount: { type: 'number', example: 500.0 },
            balanceBefore: { type: 'number' },
            balanceAfter: { type: 'number' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    paths: {
      '/api/v1/accounts': {
        post: {
          tags: ['Comptes'],
          summary: 'Créer un nouveau compte bancaire',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ownerName', 'type'],
                  properties: {
                    ownerName: { type: 'string', example: 'Alice Dupont' },
                    type: { type: 'string', enum: ['CHECKING', 'SAVINGS'] },
                    initialBalance: { type: 'number', example: 1000 },
                    currency: { type: 'string', enum: ['EUR', 'USD', 'GBP', 'CHF', 'CAD'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Compte créé avec succès' },
            400: { description: 'Données invalides' },
          },
        },
        get: {
          tags: ['Comptes'],
          summary: 'Lister tous les comptes (pagination)',
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['CHECKING', 'SAVINGS'] } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: { 200: { description: 'Liste des comptes' } },
        },
      },
      '/api/v1/accounts/{id}': {
        get: {
          tags: ['Comptes'],
          summary: 'Consulter un compte par ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Détails du compte' }, 404: { description: 'Compte introuvable' } },
        },
        delete: {
          tags: ['Comptes'],
          summary: 'Supprimer un compte (solde doit être 0)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Compte supprimé' },
            400: { description: 'Solde non nul' },
            404: { description: 'Compte introuvable' },
          },
        },
      },
      '/api/v1/accounts/{id}/deposit': {
        post: {
          tags: ['Transactions'],
          summary: 'Effectuer un dépôt sur un compte',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number', example: 5000 },
                    description: { type: 'string', example: 'Salaire' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Dépôt effectué' },
            400: { description: 'Montant invalide' },
            403: { description: 'Compte bloqué' },
            404: { description: 'Compte introuvable' },
          },
        },
      },
      '/api/v1/accounts/{id}/withdraw': {
        post: {
          tags: ['Transactions'],
          summary: 'Effectuer un retrait depuis un compte',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number', example: 2000 },
                    description: { type: 'string', example: 'Retrait DAB' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Retrait effectué' },
            400: { description: 'Montant invalide ou solde insuffisant' },
            403: { description: 'Compte bloqué' },
            404: { description: 'Compte introuvable' },
          },
        },
      },
      '/api/v1/accounts/{id}/transfer': {
        post: {
          tags: ['Transactions'],
          summary: 'Transfert vers un autre compte',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'ID compte source' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'toAccountId'],
                  properties: {
                    toAccountId: { type: 'string' },
                    amount: { type: 'number', example: 1000 },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Transfert effectué' },
            400: { description: 'Solde insuffisant' },
            404: { description: 'Compte introuvable' },
          },
        },
      },
      '/api/v1/accounts/{id}/transactions': {
        get: {
          tags: ['Transactions'],
          summary: "Historique des transactions d'un compte",
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Liste des transactions' }, 404: { description: 'Compte introuvable' } },
        },
      },
      '/health': {
        get: {
          tags: ['Comptes'],
          summary: "Vérifier la santé de l'API",
          responses: { 200: { description: 'API opérationnelle' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(swaggerOptions);
