// ══════════════════════════════════════════════════════════════════
//  TESTS D'INTÉGRATION — /health et routes inconnues
// ══════════════════════════════════════════════════════════════════

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models/db');

beforeEach(() => {
  db.accounts.length = 0;
  db.transactions.length = 0;
});

describe('GET /health', () => {
  it('retourne le statut OK avec les statistiques', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.version).toBe('2.0.0');
    expect(res.body.stats).toHaveProperty('totalAccounts');
    expect(res.body.stats).toHaveProperty('totalTransactions');
  });

  it('met à jour le compteur totalAccounts après création', async () => {
    await request(app).post('/api/v1/accounts').send({ ownerName: 'Xavier', type: 'CHECKING' });
    const res = await request(app).get('/health');
    expect(res.body.stats.totalAccounts).toBe(1);
  });
});

describe('Routes inconnues', () => {
  it('retourne 404 pour une route GET inexistante', async () => {
    const res = await request(app).get('/route/qui/n/existe/pas');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('retourne 404 pour une méthode non supportée sur une route existante', async () => {
    const res = await request(app).patch('/api/v1/accounts');
    expect(res.status).toBe(404);
  });
});

describe('GET /api-docs', () => {
  it('retourne 200 et du HTML', async () => {
    const res = await request(app).get('/api-docs');
    expect(res.status).toBe(200);
    expect(res.text).toContain('NGANFANG KENGNI IDE MERVEILLE');
  });
});
