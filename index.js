// ══════════════════════════════════════════════════════════════════
//  SERVER — Point d'entrée
//  ICT304 — Banking API v2
//  Auteur : NGANFANG KENGNI IDE MERVEILLE — 22V2344
// ══════════════════════════════════════════════════════════════════

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🏦 Banking API v2 démarrée sur http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles :`);
  console.log(`   POST   /api/v1/accounts`);
  console.log(`   GET    /api/v1/accounts`);
  console.log(`   GET    /api/v1/accounts/:id`);
  console.log(`   DELETE /api/v1/accounts/:id`);
  console.log(`   POST   /api/v1/accounts/:id/deposit`);
  console.log(`   POST   /api/v1/accounts/:id/withdraw`);
  console.log(`   POST   /api/v1/accounts/:id/transfer`);
  console.log(`   GET    /api/v1/accounts/:id/transactions`);
  console.log(`   GET    /health`);
  console.log(`   GET    /swagger`);
  console.log(`   GET    /api-docs\n`);
});

module.exports = app;
