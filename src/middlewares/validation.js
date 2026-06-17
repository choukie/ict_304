// ══════════════════════════════════════════════════════════════════
//  MIDDLEWARE — Validation des données
// ══════════════════════════════════════════════════════════════════

const VALID_TYPES = ['CHECKING', 'SAVINGS'];
const VALID_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'];
const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

function validateCreateAccount(body) {
  const errors = [];

  if (!body.ownerName || typeof body.ownerName !== 'string' || body.ownerName.trim().length < 2) {
    errors.push('ownerName : requis, minimum 2 caractères');
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    errors.push(`type : requis, valeurs acceptées : ${VALID_TYPES.join(', ')}`);
  }

  if (body.initialBalance !== undefined) {
    const bal = parseFloat(body.initialBalance);
    if (isNaN(bal) || bal < 0) {
      errors.push('initialBalance : doit être un nombre >= 0');
    }
  }

  if (body.currency && !VALID_CURRENCIES.includes(body.currency)) {
    errors.push(`currency : valeurs acceptées : ${VALID_CURRENCIES.join(', ')}`);
  }

  return errors;
}

function validateAmount(amount) {
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) {
    return { valid: false, message: 'amount : doit être un nombre strictement positif' };
  }
  return { valid: true, value: parsed };
}

module.exports = {
  validateCreateAccount,
  validateAmount,
  VALID_TYPES,
  VALID_CURRENCIES,
  VALID_STATUSES,
};
