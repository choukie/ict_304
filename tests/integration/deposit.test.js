// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — POST /api/v1/accounts/:id/deposit
//  Couvre les chemins CFG : P1(404) P2(403) P3(400 montant) P4(200)
// ══════════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models/db');

async function createAccount(overrides = {}) {
  const res = await request(app)
    .post('/api/v1/accounts')
    .send({ ownerName: 'Test User', type: 'CHECKING', initialBalance: 1000, ...overrides });
  return res.body.data;
}

beforeEach(() => {
  db.accounts.length = 0;
  db.transactions.length = 0;
});

describe('POST /api/v1/accounts/:id/deposit', () => {
  // ─── TC_02_P1 : compte introuvable → 404 ──────────────────────
  it('TC_02_P1 — retourne 404 si le compte n\'existe pas', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/id-inexistant/deposit')
      .send({ amount: 1000 });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('introuvable');
  });

  // ─── TC_02_P2 : compte bloqué → 403 ───────────────────────────
  it('TC_02_P2 — retourne 403 si le compte est BLOCKED', async () => {
    const account = await createAccount();
    account.status = 'BLOCKED';
    const acc = db.accounts.find((a) => a.id === account.id);
    acc.status = 'BLOCKED';

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/deposit`)
      .send({ amount: 500 });

    expect(res.status).toBe(403);
  });

  // ─── TC_02_P3 : montant invalide → 400 ────────────────────────
  it('TC_02_P3 — retourne 400 pour un montant négatif', async () => {
    const account = await createAccount();

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/deposit`)
      .send({ amount: -50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('strictement positif');
  });

  it('retourne 400 pour un montant égal à 0', async () => {
    const account = await createAccount();
    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/deposit`)
      .send({ amount: 0 });
    expect(res.status).toBe(400);
  });

  // ─── TC_02_P4 : dépôt valide → 200 ─────────────────────────────
  it('TC_02_P4 — effectue un dépôt valide et met à jour le solde (200)', async () => {
    const account = await createAccount({ initialBalance: 1000 });

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/deposit`)
      .send({ amount: 500 });

    expect(res.status).toBe(200);
    expect(res.body.data.account.balance).toBe(1500);
    expect(res.body.data.transaction.type).toBe('DEPOSIT');
    expect(res.body.data.transaction.amount).toBe(500);
  });

  it('enregistre une transaction DEPOSIT dans l\'historique', async () => {
    const account = await createAccount({ initialBalance: 0 });
    await request(app).post(`/api/v1/accounts/${account.id}/deposit`).send({ amount: 200 });

    const tx = db.transactions.filter((t) => t.accountId === account.id);
    expect(tx).toHaveLength(1);
    expect(tx[0].balanceBefore).toBe(0);
    expect(tx[0].balanceAfter).toBe(200);
  });
});
