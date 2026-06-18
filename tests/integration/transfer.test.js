// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — POST /api/v1/accounts/:id/transfer
//  Couvre les chemins CFG : P1(404 source) P2(403 source)
//   P3(404 dest) P4(403 dest) P5(400 montant) P6(400 solde) P7(200)
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

describe('POST /api/v1/accounts/:id/transfer', () => {
  // ─── TC_04_P1 : source introuvable → 404 ──────────────────────
  it('TC_04_P1 — retourne 404 si le compte source n\'existe pas', async () => {
    const dest = await createAccount();

    const res = await request(app)
      .post('/api/v1/accounts/faux-id/transfer')
      .send({ toAccountId: dest.id, amount: 100 });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('source');
  });

  // ─── TC_04_P2 : source bloquée → 403 ──────────────────────────
  it('TC_04_P2 — retourne 403 si le compte source est BLOCKED', async () => {
    const source = await createAccount();
    const dest = await createAccount();
    db.accounts.find((a) => a.id === source.id).status = 'BLOCKED';

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: 100 });

    expect(res.status).toBe(403);
  });

  // ─── TC_04_P3 : destinataire introuvable → 404 ────────────────
  it('TC_04_P3 — retourne 404 si le compte destinataire n\'existe pas', async () => {
    const source = await createAccount();

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: 'faux-id', amount: 100 });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('destinataire');
  });

  // ─── TC_04_P4 : destinataire bloqué → 403 ─────────────────────
  it('TC_04_P4 — retourne 403 si le compte destinataire est BLOCKED', async () => {
    const source = await createAccount();
    const dest = await createAccount();
    db.accounts.find((a) => a.id === dest.id).status = 'BLOCKED';

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: 100 });

    expect(res.status).toBe(403);
  });

  // ─── TC_04_P5 : montant invalide → 400 ────────────────────────
  it('TC_04_P5 — retourne 400 pour un montant négatif', async () => {
    const source = await createAccount();
    const dest = await createAccount();

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: -1 });

    expect(res.status).toBe(400);
  });

  // ─── TC_04_P6 : solde insuffisant → 400 ───────────────────────
  it('TC_04_P6 — retourne 400 si le solde source est insuffisant', async () => {
    const source = await createAccount({ initialBalance: 100 });
    const dest = await createAccount();

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: 500 });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Solde insuffisant');
  });

  // ─── TC_04_P7 : transfert valide → 200 ────────────────────────
  it('TC_04_P7 — effectue un transfert valide entre 2 comptes (200)', async () => {
    const source = await createAccount({ initialBalance: 1000 });
    const dest = await createAccount({ initialBalance: 0 });

    const res = await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: 300 });

    expect(res.status).toBe(200);
    expect(res.body.data.from.balance).toBe(700);
    expect(res.body.data.to.balance).toBe(300);
  });

  it('crée 2 transactions (WITHDRAWAL + DEPOSIT) lors d\'un transfert', async () => {
    const source = await createAccount({ initialBalance: 1000 });
    const dest = await createAccount({ initialBalance: 0 });

    await request(app)
      .post(`/api/v1/accounts/${source.id}/transfer`)
      .send({ toAccountId: dest.id, amount: 300 });

    const sourceTx = db.transactions.find((t) => t.accountId === source.id && t.type === 'WITHDRAWAL');
    const destTx = db.transactions.find((t) => t.accountId === dest.id && t.type === 'DEPOSIT');

    expect(sourceTx).toBeDefined();
    expect(destTx).toBeDefined();
    expect(sourceTx.amount).toBe(300);
    expect(destTx.amount).toBe(300);
  });
});
