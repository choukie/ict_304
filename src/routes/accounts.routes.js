// ══════════════════════════════════════════════════════════════════
//  ROUTES — Comptes bancaires
// ══════════════════════════════════════════════════════════════════

const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const transactionsController = require('../controllers/transactionsController');

router.post('/', accountsController.createAccount);
router.get('/', accountsController.listAccounts);
router.get('/:id', accountsController.getAccount);
router.delete('/:id', accountsController.deleteAccount);

router.post('/:id/deposit', transactionsController.deposit);
router.post('/:id/withdraw', transactionsController.withdraw);
router.post('/:id/transfer', transactionsController.transfer);
router.get('/:id/transactions', transactionsController.getTransactions);

module.exports = router;
