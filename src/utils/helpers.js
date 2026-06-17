// ══════════════════════════════════════════════════════════════════
//  UTILS — Helpers partagés
// ══════════════════════════════════════════════════════════════════

const db = require('../models/db');

function generateAccountNumber() {
  const prefix = 'BNK';
  const digits = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}-${digits}`;
}

function findAccount(id) {
  return db.accounts.find((a) => a.id === id);
}

function findAccountIndex(id) {
  return db.accounts.findIndex((a) => a.id === id);
}

function successResponse(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

function errorResponse(res, message, status = 400, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(status).json(body);
}

function round2(n) {
  return parseFloat(parseFloat(n).toFixed(2));
}

module.exports = {
  generateAccountNumber,
  findAccount,
  findAccountIndex,
  successResponse,
  errorResponse,
  round2,
};
