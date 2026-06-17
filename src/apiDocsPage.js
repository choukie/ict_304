// ══════════════════════════════════════════════════════════════════
//  PAGE — Documentation /api-docs
// ══════════════════════════════════════════════════════════════════

function apiDocsPage() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>API Documentation — Devoir 304</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    header { background: linear-gradient(135deg, #1e3a5f, #0f172a); padding: 40px 20px; text-align: center; border-bottom: 2px solid #1d4ed8; }
    .badge { display: inline-block; background: #1d4ed8; color: #fff; padding: 4px 14px; border-radius: 20px; font-size: 13px; margin-bottom: 16px; }
    header h1 { font-size: 2rem; color: #60a5fa; margin-bottom: 8px; }
    .student-card { display: inline-block; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px 32px; margin-top: 20px; text-align: left; }
    .student-card p { margin: 4px 0; font-size: 15px; }
    .student-card span { color: #60a5fa; font-weight: bold; }
    .container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
    .section-title { font-size: 1.1rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin: 32px 0 16px; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 10px; margin-bottom: 14px; overflow: hidden; }
    .endpoint-header { display: flex; align-items: center; padding: 14px 18px; gap: 14px; }
    .method { font-weight: bold; font-size: 13px; padding: 4px 12px; border-radius: 6px; min-width: 60px; text-align: center; }
    .GET    { background: #065f46; color: #6ee7b7; }
    .POST   { background: #1e3a5f; color: #93c5fd; }
    .DELETE { background: #4c1a1a; color: #fca5a5; }
    .path   { font-family: monospace; font-size: 15px; color: #e2e8f0; }
    .desc   { margin-left: auto; font-size: 13px; color: #94a3b8; }
    .links  { margin-top: 24px; text-align: center; }
    .links a { color: #60a5fa; text-decoration: none; margin: 0 12px; font-size: 14px; }
    .links a:hover { text-decoration: underline; }
    footer  { text-align: center; padding: 30px; color: #475569; font-size: 13px; border-top: 1px solid #1e293b; margin-top: 40px; }
  </style>
</head>
<body>
  <header>
    <div class="badge">Devoir 304 — ICT</div>
    <h1>🏦 Banking Transaction API v2</h1>
    <p style="color:#94a3b8">Système de gestion de comptes et transactions bancaires</p>
    <div class="student-card">
      <p>👤 Nom &nbsp;&nbsp;&nbsp;&nbsp;: <span>NGANFANG KENGNI IDE MERVEILLE</span></p>
      <p>🎓 Matricule : <span>22V2344</span></p>
    </div>
    <div class="links">
      <a href="/swagger">📘 Documentation Swagger</a>
      <a href="/health">💓 Health Check</a>
    </div>
  </header>

  <div class="container">
    <div class="section-title">📋 Endpoints — Comptes</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method POST">POST</span><span class="path">/api/v1/accounts</span><span class="desc">Créer un nouveau compte bancaire</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method GET">GET</span><span class="path">/api/v1/accounts</span><span class="desc">Lister tous les comptes (pagination)</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method GET">GET</span><span class="path">/api/v1/accounts/:id</span><span class="desc">Consulter un compte par ID</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method DELETE">DELETE</span><span class="path">/api/v1/accounts/:id</span><span class="desc">Supprimer un compte (solde = 0)</span></div></div>

    <div class="section-title">💸 Endpoints — Transactions</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method POST">POST</span><span class="path">/api/v1/accounts/:id/deposit</span><span class="desc">Effectuer un dépôt</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method POST">POST</span><span class="path">/api/v1/accounts/:id/withdraw</span><span class="desc">Effectuer un retrait</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method POST">POST</span><span class="path">/api/v1/accounts/:id/transfer</span><span class="desc">Transfert vers un autre compte</span></div></div>
    <div class="endpoint"><div class="endpoint-header"><span class="method GET">GET</span><span class="path">/api/v1/accounts/:id/transactions</span><span class="desc">Historique des transactions</span></div></div>

    <div class="section-title">⚙️ Utilitaires</div>
    <div class="endpoint"><div class="endpoint-header"><span class="method GET">GET</span><span class="path">/health</span><span class="desc">Santé de l'API</span></div></div>
  </div>

  <footer>Banking API v2.0.0 — Devoir 304 &nbsp;|&nbsp; NGANFANG KENGNI IDE MERVEILLE &nbsp;|&nbsp; 22V2344</footer>
</body>
</html>`;
}

module.exports = apiDocsPage;
