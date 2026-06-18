// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — POST /api/v1/accounts/:id/withdraw
//  Couvre les chemins CFG : P1(404) P2(403) P3(400 montant)
//                            P4(400 solde) P5(200)
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

describe('POST /api/v1/accounts/:id/withdraw', () => {
  // ─── TC_03_P1 : compte introuvable → 404 ──────────────────────
  it('TC_03_P1 — retourne 404 si le compte n\'existe pas', async () => {
    const res = await request(app)
      .post('/api/v1/accounts/id-inexistant/withdraw')
      .send({ amount: 100 });

    expect(res.status).toBe(404);
  });

  // ─── TC_03_P2 : compte bloqué → 403 ───────────────────────────
  it('TC_03_P2 — retourne 403 si le compte est BLOCKED', async () => {
    const account = await createAccount();
    db.accounts.find((a) => a.id === account.id).status = 'BLOCKED';

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/withdraw`)
      .send({ amount: 100 });

    expect(res.status).toBe(403);
  });

  // ─── TC_03_P3 : montant invalide → 400 ────────────────────────
  it('TC_03_P3 — retourne 400 pour un montant invalide (NaN)', async () => {
    const account = await createAccount();

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/withdraw`)
      .send({ amount: 'abc' });

    expect(res.status).toBe(400);
  });

  // ─── TC_03_P4 : solde insuffisant → 400 ───────────────────────
  it('TC_03_P4 — retourne 400 si le solde est insuffisant', async () => {
    const account = await createAccount({ initialBalance: 100 });

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/withdraw`)
      .send({ amount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Solde insuffisant');
    expect(res.body.message).toContain('100');
  });

  // ─── TC_03_P5 : retrait valide → 200 ───────────────────────────
  it('TC_03_P5 — effectue un retrait valide et débite le solde (200)', async () => {
    const account = await createAccount({ initialBalance: 1000 });

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/withdraw`)
      .send({ amount: 200 });

    expect(res.status).toBe(200);
    expect(res.body.data.account.balance).toBe(800);
    expect(res.body.data.transaction.type).toBe('WITHDRAWAL');
  });

  it('permet un retrait exactement égal au solde disponible', async () => {
    const account = await createAccount({ initialBalance: 300 });

    const res = await request(app)
      .post(`/api/v1/accounts/${account.id}/withdraw`)
      .send({ amount: 300 });

    expect(res.status).toBe(200);
    expect(res.body.data.account.balance).toBe(0);
  });
});
