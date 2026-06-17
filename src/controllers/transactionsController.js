// ══════════════════════════════════════════════════════════════════
//  CONTROLLER — Transactions
//  Endpoints : deposit | withdraw | transfer | transactions (historique)
// ══════════════════════════════════════════════════════════════════

const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const {
  findAccount,
  successResponse,
  errorResponse,
  round2,
} = require('../utils/helpers');
const { validateAmount } = require('../middlewares/validation');

// POST /api/v1/accounts/:id/deposit — Effectuer un dépôt
function deposit(req, res) {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }
  if (account.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte est ${account.status}`, 403);
  }

  const check = validateAmount(req.body.amount);
  if (!check.valid) {
    return errorResponse(res, check.message, 400);
  }

  const amount = round2(check.value);
  const balanceBefore = account.balance;
  account.balance = round2(account.balance + amount);
  account.updatedAt = new Date().toISOString();

  const transaction = {
    id: uuidv4(),
    accountId: account.id,
    type: 'DEPOSIT',
    amount,
    balanceBefore,
    balanceAfter: account.balance,
    description: req.body.description || 'Dépôt',
    createdAt: new Date().toISOString(),
  };
  db.transactions.push(transaction);

  return successResponse(res, {
    account: {
      id: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
    },
    transaction,
  });
}

// POST /api/v1/accounts/:id/withdraw — Effectuer un retrait
function withdraw(req, res) {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }
  if (account.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte est ${account.status}`, 403);
  }

  const check = validateAmount(req.body.amount);
  if (!check.valid) {
    return errorResponse(res, check.message, 400);
  }

  const amount = round2(check.value);
  if (amount > account.balance) {
    return errorResponse(
      res,
      `Solde insuffisant. Solde disponible : ${account.balance} ${account.currency}`,
      400
    );
  }

  const balanceBefore = account.balance;
  account.balance = round2(account.balance - amount);
  account.updatedAt = new Date().toISOString();

  const transaction = {
    id: uuidv4(),
    accountId: account.id,
    type: 'WITHDRAWAL',
    amount,
    balanceBefore,
    balanceAfter: account.balance,
    description: req.body.description || 'Retrait',
    createdAt: new Date().toISOString(),
  };
  db.transactions.push(transaction);

  return successResponse(res, {
    account: {
      id: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      currency: account.currency,
    },
    transaction,
  });
}

// POST /api/v1/accounts/:id/transfer — Transfert vers un autre compte
function transfer(req, res) {
  const sourceAccount = findAccount(req.params.id);
  if (!sourceAccount) {
    return errorResponse(res, `Compte source avec l'ID '${req.params.id}' introuvable`, 404);
  }
  if (sourceAccount.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte source est ${sourceAccount.status}`, 403);
  }

  const { toAccountId, description } = req.body;
  const destAccount = findAccount(toAccountId);
  if (!destAccount) {
    return errorResponse(res, `Compte destinataire avec l'ID '${toAccountId}' introuvable`, 404);
  }
  if (destAccount.status !== 'ACTIVE') {
    return errorResponse(res, `Opération refusée : le compte destinataire est ${destAccount.status}`, 403);
  }

  const check = validateAmount(req.body.amount);
  if (!check.valid) {
    return errorResponse(res, check.message, 400);
  }

  const amount = round2(check.value);
  if (amount > sourceAccount.balance) {
    return errorResponse(
      res,
      `Solde insuffisant. Solde disponible : ${sourceAccount.balance} ${sourceAccount.currency}`,
      400
    );
  }

  const now = new Date().toISOString();
  sourceAccount.balance = round2(sourceAccount.balance - amount);
  sourceAccount.updatedAt = now;
  destAccount.balance = round2(destAccount.balance + amount);
  destAccount.updatedAt = now;

  const txOut = {
    id: uuidv4(),
    accountId: sourceAccount.id,
    type: 'WITHDRAWAL',
    amount,
    balanceBefore: round2(sourceAccount.balance + amount),
    balanceAfter: sourceAccount.balance,
    description: description || `Transfert vers ${destAccount.accountNumber}`,
    createdAt: now,
  };
  const txIn = {
    id: uuidv4(),
    accountId: destAccount.id,
    type: 'DEPOSIT',
    amount,
    balanceBefore: round2(destAccount.balance - amount),
    balanceAfter: destAccount.balance,
    description: description || `Transfert depuis ${sourceAccount.accountNumber}`,
    createdAt: now,
  };
  db.transactions.push(txOut, txIn);

  return successResponse(res, {
    from: { id: sourceAccount.id, accountNumber: sourceAccount.accountNumber, balance: sourceAccount.balance },
    to: { id: destAccount.id, accountNumber: destAccount.accountNumber, balance: destAccount.balance },
    amount,
  });
}

// GET /api/v1/accounts/:id/transactions — Historique
function getTransactions(req, res) {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }

  const accountTransactions = db.transactions
    .filter((t) => t.accountId === req.params.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return successResponse(res, {
    accountId: req.params.id,
    accountNumber: account.accountNumber,
    transactions: accountTransactions,
    total: accountTransactions.length,
  });
}

module.exports = {
  deposit,
  withdraw,
  transfer,
  getTransactions,
};
