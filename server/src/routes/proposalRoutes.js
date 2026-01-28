const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

// Rota para gerar proposta PDF
router.post('/generate', proposalController.generateProposal);

// Rota para listar modelos disponíveis
router.get('/templates', proposalController.listTemplates);

module.exports = router;
