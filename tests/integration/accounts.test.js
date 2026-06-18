// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — POST /api/v1/accounts
//  Couvre les chemins CFG : P1 (400), P2 (201 solde=0), P3 (201 solde>0)
// ══════════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models/db');

beforeEach(() => {
  db.accounts.length = 0;
  db.transactions.length = 0;
});

describe('POST /api/v1/accounts', () => {
  // ─── TC_01_P1 : validation échoue → 400 ───────────────────────
  it('TC_01_P1 — refuse la création avec ownerName manquant (400)', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .send({ type: 'CHECKING' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toContain('ownerName : requis, minimum 2 caractères');
  });

  it('refuse la création avec un type invalide (400)', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .send({ ownerName: 'Alice', type: 'CURRENT' });

    expect(res.status).toBe(400);
  });

  // ─── TC_01_P2 : succès, solde initial = 0 → 201, pas de transaction ──
  it('TC_01_P2 — crée un compte avec solde 0 sans transaction initiale (201)', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .send({ ownerName: 'Bob', type: 'SAVINGS', initialBalance: 0 });

    expect(res.status).toBe(201);
    expect(res.body.data.balance).toBe(0);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(db.transactions).toHaveLength(0);
  });

  // ─── TC_01_P3 : succès, solde initial > 0 → 201 + transaction DEPOSIT ──
  it('TC_01_P3 — crée un compte avec solde initial et une transaction DEPOSIT (201)', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .send({ ownerName: 'Charlie', type: 'CHECKING', initialBalance: 5000 });

    expect(res.status).toBe(201);
    expect(res.body.data.balance).toBe(5000);
    expect(res.body.data.accountNumber).toMatch(/^BNK-\d{8}$/);
    expect(db.transactions).toHaveLength(1);
    expect(db.transactions[0].type).toBe('DEPOSIT');
    expect(db.transactions[0].amount).toBe(5000);
  });

  it('applique EUR comme devise par défaut', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .send({ ownerName: 'Dana', type: 'CHECKING' });

    expect(res.body.data.currency).toBe('EUR');
  });
});

describe('GET /api/v1/accounts', () => {
  it('retourne une liste vide quand aucun compte n\'existe', async () => {
    const res = await request(app).get('/api/v1/accounts');
    expect(res.status).toBe(200);
    expect(res.body.data.accounts).toHaveLength(0);
  });

  it('retourne les comptes créés avec pagination', async () => {
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Alice', type: 'CHECKING' });
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Bob', type: 'SAVINGS' });

    const res = await request(app).get('/api/v1/accounts');
    expect(res.body.data.accounts).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('filtre les comptes par type', async () => {
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Alice', type: 'CHECKING' });
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Bob', type: 'SAVINGS' });

    const res = await request(app).get('/api/v1/accounts?type=SAVINGS');
    expect(res.body.data.accounts).toHaveLength(1);
    expect(res.body.data.accounts[0].type).toBe('SAVINGS');
  });

  it('filtre les comptes par status', async () => {
    const created = await request(app).post('/api/v1/accounts').send({ ownerName: 'Alice', type: 'CHECKING' });
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Bob', type: 'SAVINGS' });
    db.accounts.find((a) => a.id === created.body.data.id).status = 'BLOCKED';

    const res = await request(app).get('/api/v1/accounts?status=BLOCKED');
    expect(res.body.data.accounts).toHaveLength(1);
    expect(res.body.data.accounts[0].status).toBe('BLOCKED');
  });
});

describe('GET /api/v1/accounts/:id', () => {
  it('retourne 404 si le compte n\'existe pas', async () => {
    const res = await request(app).get('/api/v1/accounts/id-inexistant');
    expect(res.status).toBe(404);
  });

  it('retourne les détails d\'un compte existant', async () => {
    const create = await request(app)
      .post('/api/v1/accounts')
      .send({ ownerName: 'Eve', type: 'CHECKING' });
    const id = create.body.data.id;

    const res = await request(app).get(`/api/v1/accounts/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.ownerName).toBe('Eve');
  });
});
