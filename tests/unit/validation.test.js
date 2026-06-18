// ══════════════════════════════════════════════════════════════════
//  TESTS UNITAIRES — Validation (middlewares/validation.js)
//  Teste les fonctions de validation isolément, sans HTTP
// ══════════════════════════════════════════════════════════════════

const { validateCreateAccount, validateAmount } = require('../../src/middlewares/validation');

describe('validateCreateAccount()', () => {
  it('retourne aucune erreur pour des données valides', () => {
    const errors = validateCreateAccount({
      ownerName: 'Alice Dupont',
      type: 'CHECKING',
      initialBalance: 1000,
      currency: 'EUR',
    });
    expect(errors).toHaveLength(0);
  });

  it('retourne une erreur si ownerName est manquant', () => {
    const errors = validateCreateAccount({ type: 'CHECKING' });
    expect(errors).toContain('ownerName : requis, minimum 2 caractères');
  });

  it('retourne une erreur si ownerName a moins de 2 caractères', () => {
    const errors = validateCreateAccount({ ownerName: 'A', type: 'CHECKING' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('retourne une erreur si type est invalide', () => {
    const errors = validateCreateAccount({ ownerName: 'Alice', type: 'CURRENT' });
    expect(errors.some((e) => e.includes('type'))).toBe(true);
  });

  it('retourne une erreur si initialBalance est négatif', () => {
    const errors = validateCreateAccount({
      ownerName: 'Alice',
      type: 'CHECKING',
      initialBalance: -500,
    });
    expect(errors.some((e) => e.includes('initialBalance'))).toBe(true);
  });

  it('accepte initialBalance = 0', () => {
    const errors = validateCreateAccount({
      ownerName: 'Alice',
      type: 'SAVINGS',
      initialBalance: 0,
    });
    expect(errors).toHaveLength(0);
  });

  it('retourne une erreur si currency est non supportée', () => {
    const errors = validateCreateAccount({
      ownerName: 'Alice',
      type: 'CHECKING',
      currency: 'XAF',
    });
    expect(errors.some((e) => e.includes('currency'))).toBe(true);
  });

  it('cumule plusieurs erreurs simultanées', () => {
    const errors = validateCreateAccount({ ownerName: '', type: 'WRONG' });
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateAmount()', () => {
  it('valide un montant positif', () => {
    const result = validateAmount(100);
    expect(result.valid).toBe(true);
    expect(result.value).toBe(100);
  });

  it('rejette un montant négatif', () => {
    const result = validateAmount(-50);
    expect(result.valid).toBe(false);
  });

  it('rejette un montant nul (0)', () => {
    const result = validateAmount(0);
    expect(result.valid).toBe(false);
  });

  it('rejette une valeur non numérique', () => {
    const result = validateAmount('abc');
    expect(result.valid).toBe(false);
  });

  it('accepte une chaîne numérique valide', () => {
    const result = validateAmount('250.50');
    expect(result.valid).toBe(true);
    expect(result.value).toBeCloseTo(250.5);
  });
});
