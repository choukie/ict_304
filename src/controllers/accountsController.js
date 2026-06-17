// ══════════════════════════════════════════════════════════════════
//  CONTROLLER — Comptes bancaires
//  Endpoints : POST/GET /accounts | GET/DELETE /accounts/:id
// ══════════════════════════════════════════════════════════════════

const { v4: uuidv4 } = require('uuid');
const db = require('../models/db');
const {
  generateAccountNumber,
  findAccount,
  findAccountIndex,
  successResponse,
  errorResponse,
  round2,
} = require('../utils/helpers');
const { validateCreateAccount } = require('../middlewares/validation');

// POST /api/v1/accounts — Créer un compte
function createAccount(req, res) {
  const { ownerName, type, initialBalance = 0, currency = 'EUR' } = req.body;

  const errors = validateCreateAccount(req.body);
  if (errors.length > 0) {
    return errorResponse(res, 'Données invalides', 400, errors);
  }

  const newAccount = {
    id: uuidv4(),
    accountNumber: generateAccountNumber(),
    ownerName: ownerName.trim(),
    type,
    balance: round2(initialBalance),
    currency,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
    });
  }

  return successResponse(res, newAccount, 201);
}

// GET /api/v1/accounts — Lister les comptes (pagination)
function listAccounts(req, res) {
  let { type, status, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = Math.min(parseInt(limit), 100);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  let filtered = [...db.accounts];

  if (type && ['CHECKING', 'SAVINGS'].includes(type)) {
    filtered = filtered.filter((a) => a.type === type);
  }
  if (status && ['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
    filtered = filtered.filter((a) => a.status === status);
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
      hasPrevPage: page > 1,
    },
  });
}

// GET /api/v1/accounts/:id — Détails d'un compte
function getAccount(req, res) {
  const account = findAccount(req.params.id);
  if (!account) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }
  return successResponse(res, account);
}

// DELETE /api/v1/accounts/:id — Supprimer un compte
function deleteAccount(req, res) {
  const idx = findAccountIndex(req.params.id);
  if (idx === -1) {
    return errorResponse(res, `Compte avec l'ID '${req.params.id}' introuvable`, 404);
  }

  const account = db.accounts[idx];
  if (account.balance > 0) {
    return errorResponse(
      res,
      `Impossible de supprimer un compte avec un solde non nul. Solde actuel : ${account.balance} ${account.currency}`,
      400
    );
  }

  db.accounts.splice(idx, 1);
  return successResponse(res, { message: 'Compte supprimé avec succès', id: req.params.id });
}

module.exports = {
  createAccount,
  listAccounts,
  getAccount,
  deleteAccount,
};
