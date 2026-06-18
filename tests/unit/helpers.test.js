// ══════════════════════════════════════════════════════════════════
//  TESTS UNITAIRES — Helpers (utils/helpers.js)
// ══════════════════════════════════════════════════════════════════

const db = require('../../src/models/db');
const {
  generateAccountNumber,
  findAccount,
  findAccountIndex,
  round2,
} = require('../../src/utils/helpers');

beforeEach(() => {
  db.accounts.length = 0;
  db.transactions.length = 0;
});

describe('generateAccountNumber()', () => {
  it('génère un numéro avec le préfixe BNK-', () => {
    const num = generateAccountNumber();
    expect(num).toMatch(/^BNK-\d{8}$/);
  });

  it('génère des numéros différents à chaque appel', () => {
    const num1 = generateAccountNumber();
    const num2 = generateAccountNumber();
    // Probabilité de collision quasi nulle sur 8 chiffres aléatoires
    expect(num1).not.toBe(num2);
  });
});

describe('findAccount() / findAccountIndex()', () => {
  it('retourne undefined si le compte n\'existe pas', () => {
    expect(findAccount('id-inexistant')).toBeUndefined();
  });

  it('retourne -1 si le compte n\'existe pas (index)', () => {
    expect(findAccountIndex('id-inexistant')).toBe(-1);
  });

  it('retrouve un compte existant par son id', () => {
    db.accounts.push({ id: 'abc-123', ownerName: 'Test' });
    const found = findAccount('abc-123');
    expect(found).toBeDefined();
    expect(found.ownerName).toBe('Test');
  });

  it('retrouve le bon index pour un compte existant', () => {
    db.accounts.push({ id: 'x1' }, { id: 'x2' }, { id: 'x3' });
    expect(findAccountIndex('x2')).toBe(1);
  });
});

describe('round2()', () => {
  it('arrondit correctement à 2 décimales', () => {
    expect(round2(10.456)).toBe(10.46);
  });

  it('garde un nombre entier inchangé', () => {
    expect(round2(100)).toBe(100);
  });

  it('gère les erreurs d\'arrondi flottant classiques (0.1 + 0.2)', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
});
