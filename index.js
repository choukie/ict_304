// ══════════════════════════════════════════════════════════════════
//  SYSTÈME DE TRANSACTION BANCAIRE — API REST
//  Devoir 304
//  Stack : Node.js + Express
//  Endpoints : POST /accounts | GET /accounts | GET /accounts/:id
// ══════════════════════════════════════════════════════════════════

const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

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
