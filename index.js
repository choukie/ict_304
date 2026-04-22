// ══════════════════════════════════════════════════════════════════
//  SYSTÈME DE TRANSACTION BANCAIRE — API REST
//  Devoir 304
//  Stack : Node.js + Express
//  Endpoints : POST /accounts | GET /accounts | GET /accounts/:id
// ══════════════════════════════════════════════════════════════════

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

// ─── SWAGGER CONFIGURATION ───────────────────────────────────────────
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ICT304 — API Bancaire Multibanque',
      version: '1.0.0',
      description: `**Système de Transaction Bancaire Mobile**\n\n👤 **Auteur :** NGANFANG KENGNI IDE MERVEILLE\n\n🎓 **Matricule :** 22V2344`,
    },
    servers: [{ url: 'https://ict-304-opij.onrender.com', description: 'Production' }, { url: 'http://localhost:3000', description: 'Local' }],
    tags: [
      { name: 'Comptes', description: 'Gestion des comptes bancaires' },
      { name: 'Transactions', description: 'Dépôts, retraits et historique' },
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
            balance: { type: 'number', example: 1000.00 },
            currency: { type: 'string', example: 'EUR' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] },
            createdAt: { type: 'string', format: 'date-time' },
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            accountId: { type: 'string' },
            type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL'] },
            amount: { type: 'number', example: 500.00 },
            balanceBefore: { type: 'number' },
            balanceAfter: { type: 'number' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } }
          }
        }
      }
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
                    ownerName: { type: 'string', example: 'Alice Dupont', description: 'Minimum 2 caractères' },
                    type: { type: 'string', enum: ['CHECKING', 'SAVINGS'] },
                    initialBalance: { type: 'number', example: 1000, description: 'Défaut: 0' },
                    currency: { type: 'string', enum: ['EUR', 'USD', 'GBP', 'CHF', 'CAD'], description: 'Défaut: EUR' },
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Compte créé avec succès', content: { 'application/json': { schema: { properties: { success: { type: 'boolean' }, data: { '$ref': '#/components/schemas/Account' } } } } } },
            400: { description: 'Données invalides', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } }
          }
        },
        get: {
          tags: ['Comptes'],
          summary: 'Lister tous les comptes avec pagination',
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['CHECKING', 'SAVINGS'] } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'] } },
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
          ],
          responses: {
            200: { description: 'Liste des comptes' }
          }
        }
      },
      '/api/v1/accounts/{id}': {
        get: {
          tags: ['Comptes'],
          summary: 'Consulter un compte par ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Détails du compte', content: { 'application/json': { schema: { properties: { success: { type: 'boolean' }, data: { '$ref': '#/components/schemas/Account' } } } } } },
            404: { description: 'Compte introuvable', content: { 'application/json': { schema: { '$ref': '#/components/schemas/Error' } } } }
          }
        },
        delete: {
          tags: ['Comptes'],
          summary: 'Supprimer un compte (solde doit être 0)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Compte supprimé' },
            400: { description: 'Solde non nul ou compte invalide' },
            404: { description: 'Compte introuvable' }
          }
        }
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
                    amount: { type: 'number', example: 5000, description: 'Montant > 0' },
                    description: { type: 'string', example: 'Salaire du mois' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Dépôt effectué' },
            400: { description: 'Montant invalide' },
            403: { description: 'Compte suspendu ou bloqué' },
            404: { description: 'Compte introuvable' }
          }
        }
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
                    amount: { type: 'number', example: 2000, description: 'Montant > 0' },
                    description: { type: 'string', example: 'Retrait DAB' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Retrait effectué' },
            400: { description: 'Montant invalide ou solde insuffisant' },
            403: { description: 'Compte suspendu ou bloqué' },
            404: { description: 'Compte introuvable' }
          }
        }
      },
      '/api/v1/accounts/{id}/transfer': {
        post: {
          tags: ['Transactions'],
          summary: 'Transfert vers un autre compte',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' }, description: 'ID du compte source' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount', 'toAccountId'],
                  properties: {
                    toAccountId: { type: 'string', example: 'uuid-destination' },
                    amount: { type: 'number', example: 1000 },
                    description: { type: 'string', example: 'Remboursement' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Transfert effectué' },
            400: { description: 'Solde insuffisant ou montant invalide' },
            404: { description: 'Compte source ou destination introuvable' }
          }
        }
      },
      '/api/v1/accounts/{id}/transactions': {
        get: {
          tags: ['Transactions'],
          summary: 'Historique des transactions d\'un compte',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Liste des transactions' },
            404: { description: 'Compte introuvable' }
          }
        }
      },
      '/health': {
        get: {
          tags: ['Comptes'],
          summary: 'Vérifier la santé de l\'API',
          responses: { 200: { description: 'API opérationnelle' } }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ICT304 — Banking API',
  customCss: `.swagger-ui .topbar { background: #1d4ed8; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::before { content: '🏦 ICT304 — NGANFANG KENGNI IDE MERVEILLE | 22V2344'; color: white; font-size: 16px; font-weight: bold; padding: 10px; }`
}));

// ─── BASE DE DONNÉES EN MÉMOIRE ─────────────────────────────────────
const db = {
  accounts: [],
  transactions: []
};

// ─── HELPERS ────────────────────────────────────────────────────────
function generateAccountNumber() {
  const prefix = 'BNK';
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${digits}`;
}

function findAccount(id) {
  return db.accounts.find(a => a.id === id);
}

function successResponse(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function errorResponse(res, message, status = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

// ─── VALIDATION ─────────────────────────────────────────────────────
function validateCreateAccount(body) {
  const errors = [];
  if (!body.ownerName || typeof body.ownerName !== 'string' || body.ownerName.trim().length < 2)
    errors.push('ownerName : requis, minimum 2 caractères');

  const validTypes = ['CHECKING', 'SAVINGS'];
  if (!body.type || !validTypes.includes(body.type))
    errors.push(`type : requis, valeurs acceptées : ${validTypes.join(', ')}`);

  if (body.initialBalance !== undefined) {
    const bal = parseFloat(body.initialBalance);
    if (isNaN(bal) || bal < 0)
      errors.push('initialBalance : doit être un nombre >= 0');
  }

  const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'];
  if (body.currency && !validCurrencies.includes(body.currency))
    errors.push(`currency : valeurs acceptées : ${validCurrencies.join(', ')}`);

  return errors;
}

// ═══════════════════════════════════════════════════════════════════
//  ENDPOINTS COMPTES
// ═══════════════════════════════════════════════════════════════════

app.post('/api/v1/accounts', (req, res) => {
  const { ownerName, type, initialBalance = 0, currency = 'EUR' } = req.body;

  const errors = validateCreateAccount(req.body);
  if (errors.length > 0) {
    return errorResponse(res, 'Données invalides', 400, errors);
  }

  const accountNumber = generateAccountNumber();

  const newAccount = {
    id: uuidv4(),
    accountNumber,
    ownerName: ownerName.trim(),
    type,
    balance: parseFloat(parseFloat(initialBalance).toFixed(2)),
    currency,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.accounts.push(newAccount);

  if (newAccount.balance > 0) {
    db.transactions.push({
      id: uuidv4(),
      accountId: newAccount.id,
      type: 'DEPOSIT',
      amount: newAccount.balance,
      balanceBefore: 0,
      balanceAfter: newAccount.balance,
      description: 'Dépôt initial à la création du compte',
      createdAt: new Date().toISOString()
    });
  }

  return successResponse(res, newAccount, 201);
});

app.get('/api/v1/accounts', (req, res) => {
  let { type, status, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = Math.min(parseInt(limit), 100);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  let filtered = [...db.accounts]; // BUG CORRIGÉ : [...] au lieu de […]

  if (type && ['CHECKING', 'SAVINGS'].includes(type)) {
    filtered = filtered.filter(a => a.type === type);
  }
  if (status && ['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
    filtered = filtered.filter(a => a.status === status);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return successResponse(res, {
    accounts: paginated,
    pagination: {
      total,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
});

app.get('/api/v1/accounts/:id', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }
  return successResponse(res, account);
});

// ═══════════════════════════════════════════════════════════════════
//  ENDPOINTS TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════

app.post('/api/v1/accounts/:id/deposit', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }

  if (account.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte est ${account.status}`, 403);
  }

  const amount = parseFloat(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return errorResponse(res, 'amount : doit être un nombre strictement positif', 400);
  }

  const roundedAmount = parseFloat(amount.toFixed(2));
  const balanceBefore = account.balance;
  account.balance = parseFloat((account.balance + roundedAmount).toFixed(2));
  account.updatedAt = new Date().toISOString();

  const transaction = {
    id: uuidv4(),
    accountId: account.id,
    type: 'DEPOSIT',
    amount: roundedAmount,
    balanceBefore,
    balanceAfter: account.balance,
    description: req.body.description || 'Dépôt',
    createdAt: new Date().toISOString()
  };
  db.transactions.push(transaction);

  return successResponse(res, {
    account: { id: account.id, accountNumber: account.accountNumber, balance: account.balance, currency: account.currency },
    transaction
  });
});

app.post('/api/v1/accounts/:id/withdraw', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }

  if (account.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte est ${account.status}`, 403);
  }

  const amount = parseFloat(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return errorResponse(res, 'amount : doit être un nombre strictement positif', 400);
  }

  const roundedAmount = parseFloat(amount.toFixed(2));
  if (roundedAmount > account.balance) {
    return errorResponse(res, `Solde insuffisant. Solde disponible : ${account.balance} ${account.currency}`, 400);
  }

  const balanceBefore = account.balance;
  account.balance = parseFloat((account.balance - roundedAmount).toFixed(2));
  account.updatedAt = new Date().toISOString();

  const transaction = {
    id: uuidv4(),
    accountId: account.id,
    type: 'WITHDRAWAL',
    amount: roundedAmount,
    balanceBefore,
    balanceAfter: account.balance,
    description: req.body.description || 'Retrait',
    createdAt: new Date().toISOString()
  };
  db.transactions.push(transaction);

  return successResponse(res, {
    account: { id: account.id, accountNumber: account.accountNumber, balance: account.balance, currency: account.currency },
    transaction
  });
});

app.get('/api/v1/accounts/:id/transactions', (req, res) => {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }

  const accountTransactions = db.transactions
    .filter(t => t.accountId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return successResponse(res, {
    accountId: req.params.id,
    accountNumber: account.accountNumber,
    transactions: accountTransactions,
    total: accountTransactions.length
  });
});

// POST /api/v1/accounts/:id/transfer — Transfert entre comptes
app.post('/api/v1/accounts/:id/transfer', (req, res) => {
  const sourceAccount = findAccount(req.params.id);
  if (!sourceAccount) return errorResponse(res, `Compte source avec l'ID '${req.params.id}' introuvable`, 404);
  if (sourceAccount.status !== 'ACTIVE') return errorResponse(res, `Opération refusée : le compte source est ${sourceAccount.status}`, 403);

  const { toAccountId, amount, description } = req.body;
  const destAccount = findAccount(toAccountId);
  if (!destAccount) return errorResponse(res, `Compte destinataire avec l'ID '${toAccountId}' introuvable`, 404);
  if (destAccount.status !== 'ACTIVE') return errorResponse(res, `Opération refusée : le compte destinataire est ${destAccount.status}`, 403);

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) return errorResponse(res, 'amount : doit être un nombre strictement positif', 400);

  const roundedAmount = parseFloat(parsedAmount.toFixed(2));
  if (roundedAmount > sourceAccount.balance) return errorResponse(res, `Solde insuffisant. Solde disponible : ${sourceAccount.balance} ${sourceAccount.currency}`, 400);

  const now = new Date().toISOString();
  const balanceBefore = sourceAccount.balance;
  sourceAccount.balance = parseFloat((sourceAccount.balance - roundedAmount).toFixed(2));
  sourceAccount.updatedAt = now;
  destAccount.balance = parseFloat((destAccount.balance + roundedAmount).toFixed(2));
  destAccount.updatedAt = now;

  const txOut = { id: uuidv4(), accountId: sourceAccount.id, type: 'WITHDRAWAL', amount: roundedAmount, balanceBefore, balanceAfter: sourceAccount.balance, description: description || `Transfert vers ${destAccount.accountNumber}`, createdAt: now };
  const txIn  = { id: uuidv4(), accountId: destAccount.id,  type: 'DEPOSIT',    amount: roundedAmount, balanceBefore: destAccount.balance - roundedAmount, balanceAfter: destAccount.balance, description: description || `Transfert depuis ${sourceAccount.accountNumber}`, createdAt: now };
  db.transactions.push(txOut, txIn);

  return successResponse(res, { from: { id: sourceAccount.id, accountNumber: sourceAccount.accountNumber, balance: sourceAccount.balance }, to: { id: destAccount.id, accountNumber: destAccount.accountNumber, balance: destAccount.balance }, amount: roundedAmount });
});

// DELETE /api/v1/accounts/:id — Supprimer un compte
app.delete('/api/v1/accounts/:id', (req, res) => {
  const idx = db.accounts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  const account = db.accounts[idx];
  if (account.balance > 0) return errorResponse(res, `Impossible de supprimer un compte avec un solde non nul. Solde actuel : ${account.balance} ${account.currency}`, 400);
  db.accounts.splice(idx, 1);
  return successResponse(res, { message: 'Compte supprimé avec succès', id: req.params.id });
});

// ─── ROUTE DE SANTÉ ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Banking Transaction System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      totalAccounts: db.accounts.length,
      totalTransactions: db.transactions.length
    }
  });
});

// ─── PAGE DE DOCUMENTATION ───────────────────────────────────────────
app.get('/api-docs', (req, res) => res.redirect('/api-docs/'));
app.get('/api-docs/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>API Documentation — Devoir 304</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    header { background: linear-gradient(135deg, #1e3a5f, #0f172a); padding: 40px 20px; text-align: center; border-bottom: 2px solid #1d4ed8; }
    .badge { display: inline-block; background: #1d4ed8; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; margin-bottom: 16px; }
    header h1 { font-size: 2rem; color: #60a5fa; margin-bottom: 8px; }
    .student-card { display: inline-block; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px 32px; margin-top: 20px; text-align: left; }
    .student-card p { margin: 4px 0; font-size: 15px; }
    .student-card span { color: #60a5fa; font-weight: bold; }
    .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .section-title { font-size: 1.1rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 16px; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
    .endpoint-header { display: flex; align-items: center; padding: 14px 18px; gap: 14px; }
    .method { font-weight: bold; font-size: 13px; padding: 4px 12px; border-radius: 6px; min-width: 60px; text-align: center; }
    .GET    { background: #065f46; color: #6ee7b7; }
    .POST   { background: #1e3a5f; color: #93c5fd; }
    .path   { font-family: monospace; font-size: 15px; color: #e2e8f0; }
    .desc   { margin-left: auto; font-size: 13px; color: #94a3b8; }
    footer  { text-align: center; padding: 30px; color: #475569; font-size: 13px; border-top: 1px solid #1e293b; margin-top: 40px; }
  </style>
</head>
<body>
  <header>
    <div class="badge">Devoir 304 — ICT</div>
    <h1>🏦 Banking Transaction API</h1>
    <p style="color:#94a3b8">Système de gestion de comptes et transactions bancaires</p>
    <div class="student-card">
      <p>👤 Nom &nbsp;&nbsp;&nbsp;&nbsp;: <span>NGANFANG KENGNI IDE MERVEILLE</span></p>
      <p>🎓 Matricule : <span>22V2344</span></p>
      <p>🔗 Lien &nbsp;&nbsp;&nbsp;&nbsp;: <span><a href="https://ict-304-opij.onrender.com/api-docs/" style="color:#60a5fa">https://ict-304-opij.onrender.com/api-docs/</a></span></p>
    </div>
  </header>

  <div class="container">
    <div class="section-title">📋 Endpoints — Comptes</div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method POST">POST</span>
        <span class="path">/api/v1/accounts</span>
        <span class="desc">Créer un nouveau compte bancaire</span>
      </div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method GET">GET</span>
        <span class="path">/api/v1/accounts</span>
        <span class="desc">Lister tous les comptes (pagination)</span>
      </div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method GET">GET</span>
        <span class="path">/api/v1/accounts/:id</span>
        <span class="desc">Consulter un compte par ID</span>
      </div>
    </div>

    <div class="section-title">💸 Endpoints — Transactions</div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method POST">POST</span>
        <span class="path">/api/v1/accounts/:id/deposit</span>
        <span class="desc">Effectuer un dépôt</span>
      </div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method POST">POST</span>
        <span class="path">/api/v1/accounts/:id/withdraw</span>
        <span class="desc">Effectuer un retrait</span>
      </div>
    </div>
    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method GET">GET</span>
        <span class="path">/api/v1/accounts/:id/transactions</span>
        <span class="desc">Historique des transactions</span>
      </div>
    </div>

    <div class="section-title">⚙️ Utilitaires</div>

    <div class="endpoint">
      <div class="endpoint-header">
        <span class="method GET">GET</span>
        <span class="path">/health</span>
        <span class="desc">Santé de l'API</span>
      </div>
    </div>
  </div>

  <footer>Banking API v1.0.0 — Devoir 304 &nbsp;|&nbsp; NGANFANG KENGNI IDE MERVEILLE &nbsp;|&nbsp; 22V2344</footer>
</body>
</html>`);
});

// ─── GESTION ROUTES INCONNUES ────────────────────────────────────────
app.use((req, res) => {
  errorResponse(res, `Route '${req.method} ${req.path}' introuvable`, 404);
});

// ─── GESTION ERREURS GLOBALES ────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur interne :', err);
  errorResponse(res, 'Erreur interne du serveur', 500);
});

// ─── DÉMARRAGE ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏦 Banking API démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles :`);
  console.log(`   POST   /api/v1/accounts`);
  console.log(`   GET    /api/v1/accounts`);
  console.log(`   GET    /api/v1/accounts/:id`);
  console.log(`   POST   /api/v1/accounts/:id/deposit`);
  console.log(`   POST   /api/v1/accounts/:id/withdraw`);
  console.log(`   GET    /api/v1/accounts/:id/transactions`);
  console.log(`   GET    /health\n`);
});

module.exports = app;
