// ══════════════════════════════════════════════════════════════════
//  APP — Configuration Express
// ══════════════════════════════════════════════════════════════════

const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./swagger');
const apiDocsPage = require('./apiDocsPage');
const accountsRoutes = require('./routes/accounts.routes');
const db = require('./models/db');
const { errorResponse } = require('./utils/helpers');

const app = express();

app.use(cors());
app.use(express.json());

// ─── INTERFACE UTILISATEUR ────────────────────────────────────────
app.get(['/app', '/app/'], (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
});

// ─── DOCUMENTATION ────────────────────────────────────────────────
app.use(
  '/swagger',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'ICT304 — Banking API',
    customCss: `.swagger-ui .topbar { background: #1d4ed8; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::before { content: '🏦 ICT304 — NGANFANG KENGNI IDE MERVEILLE | 22V2344'; color: white; font-size: 16px; font-weight: bold; padding: 10px; }`,
  })
);

app.get(['/api-docs', '/api-docs/'], (req, res) => {
  res.send(apiDocsPage());
});

// ─── ROUTES API ───────────────────────────────────────────────────
app.use('/api/v1/accounts', accountsRoutes);

// ─── SANTÉ ────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Banking Transaction System API v2',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      totalAccounts: db.accounts.length,
      totalTransactions: db.transactions.length,
    },
  });
});

// ─── ROUTES INCONNUES ─────────────────────────────────────────────
app.use((req, res) => {
  errorResponse(res, `Route '${req.method} ${req.path}' introuvable`, 404);
});

// ─── ERREURS GLOBALES ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur interne :', err);
  errorResponse(res, 'Erreur interne du serveur', 500);
});

module.exports = app;
