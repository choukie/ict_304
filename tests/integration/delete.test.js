// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — DELETE /api/v1/accounts/:id
//  Couvre les chemins CFG : P1(404) P2(400 solde non nul) P3(200)
// ══════════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models/db');

async function createAccount(overrides = {}) {
  const res = await request(app)
    .post('/api/v1/accounts')
    .send({ ownerName: 'Test User', type: 'CHECKING', initialBalance: 0, ...overrides });
  return res.body.data;
}

beforeEach(() => {
  db.accounts.length = 0;
  db.transactions.length = 0;
});

describe('DELETE /api/v1/accounts/:id', () => {
  // ─── TC_05_P1 : compte introuvable → 404 ──────────────────────
  it('TC_05_P1 — retourne 404 si le compte n\'existe pas', async () => {
    const res = await request(app).delete('/api/v1/accounts/id-inexistant');
    expect(res.status).toBe(404);
  });

  // ─── TC_05_P2 : solde non nul → 400 ────────────────────────────
  it('TC_05_P2 — refuse la suppression si le solde n\'est pas nul (400)', async () => {
    const account = await createAccount({ initialBalance: 500 });

    const res = await request(app).delete(`/api/v1/accounts/${account.id}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('solde non nul');
    expect(db.accounts).toHaveLength(1); // le compte n'est pas supprimé
  });

  // ─── TC_05_P3 : solde nul → 200, suppression réussie ───────────
  it('TC_05_P3 — supprime un compte avec un solde nul (200)', async () => {
    const account = await createAccount({ initialBalance: 0 });

    const res = await request(app).delete(`/api/v1/accounts/${account.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('succès');
    expect(db.accounts).toHaveLength(0);
  });

  it('permet de supprimer un compte après l\'avoir vidé par un retrait', async () => {
    const account = await createAccount({ initialBalance: 200 });

    await request(app).post(`/api/v1/accounts/${account.id}/withdraw`).send({ amount: 200 });
    const res = await request(app).delete(`/api/v1/accounts/${account.id}`);

    expect(res.status).toBe(200);
  });

  it('un compte supprimé n\'est plus accessible via GET', async () => {
    const account = await createAccount({ initialBalance: 0 });
    await request(app).delete(`/api/v1/accounts/${account.id}`);

    const res = await request(app).get(`/api/v1/accounts/${account.id}`);
    expect(res.status).toBe(404);
  });
});
