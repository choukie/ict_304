// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — GET /api/v1/accounts/:id/transactions
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

describe('GET /api/v1/accounts/:id/transactions', () => {
  it('retourne 404 si le compte n\'existe pas', async () => {
    const res = await request(app).get('/api/v1/accounts/id-inexistant/transactions');
    expect(res.status).toBe(404);
  });

  it('retourne une liste vide si aucune transaction n\'existe', async () => {
    const account = await createAccount();
    const res = await request(app).get(`/api/v1/accounts/${account.id}/transactions`);

    expect(res.status).toBe(200);
    expect(res.body.data.transactions).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('retourne l\'historique trié du plus récent au plus ancien', async () => {
    const account = await createAccount({ initialBalance: 1000 });

    await request(app).post(`/api/v1/accounts/${account.id}/deposit`).send({ amount: 100 });
    await request(app).post(`/api/v1/accounts/${account.id}/withdraw`).send({ amount: 50 });

    const res = await request(app).get(`/api/v1/accounts/${account.id}/transactions`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(3); // dépôt initial + dépôt + retrait
    expect(res.body.data.transactions[0].type).toBe('WITHDRAWAL'); // le plus récent en premier
  });

  it('n\'inclut pas les transactions d\'un autre compte', async () => {
    const accountA = await createAccount({ initialBalance: 500 });
    const accountB = await createAccount({ initialBalance: 0 });

    await request(app).post(`/api/v1/accounts/${accountA.id}/deposit`).send({ amount: 100 });

    const res = await request(app).get(`/api/v1/accounts/${accountB.id}/transactions`);
    expect(res.body.data.total).toBe(0);
  });
});
