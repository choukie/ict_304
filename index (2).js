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
