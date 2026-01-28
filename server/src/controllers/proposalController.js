const path = require('path');
const fs = require('fs');
const documentService = require('../services/documentService');

// Mapeamento de campos por modelo
const TEMPLATE_FIELDS = {
  'RPBANK': {
    file: 'modeloB.odt',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date' },
      { key: 'PROPOSTA', label: 'Número da Proposta', type: 'text' },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'REQUERENTE', label: 'Requerente', type: 'text' },
      { key: 'NUMEROPROCESSO', label: 'Número do Processo', type: 'text' },
      { key: 'TOTAL', label: 'Valor Total (só número)', type: 'currency_raw' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency_raw' },
      { key: 'VALORPROPOSTA', label: 'Valor da Proposta', type: 'currency_raw' },
      { key: 'TAXAINTERMEDIACAO', label: 'Taxa de Intermediação', type: 'currency_raw' },
      { key: 'INTERMEDIACAO', label: 'Valor Intermediação', type: 'currency_raw' },
      { key: 'PARCERIA', label: 'Parceria', type: 'currency_raw' },
      { key: 'ESCRITORIO', label: 'Escritório', type: 'currency_raw' }
    ]
  },
  'SD-RESOLV': {
    file: 'MODELOA.ODT',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date' },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'PROCESSONUMERO', label: 'Número do Processo', type: 'text' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency' },
      { key: 'VALORPROPOSTA', label: 'Valor Proposta', type: 'currency' },
      { key: 'VALORINTERMEDIACAO', label: 'Valor de Intermediação', type: 'currency' },
      { key: 'TOTAL', label: 'Total', type: 'currency' }
    ]
  }
};

// Listar templates disponíveis
exports.listTemplates = (req, res) => {
  try {
    const templates = Object.entries(TEMPLATE_FIELDS).map(([key, value]) => ({
      id: key,
      name: key,
      file: value.file,
      fields: value.fields
    }));
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar templates' });
  }
};

// Gerar proposta em PDF
exports.generateProposal = async (req, res) => {
  try {
    const { templateId, formData } = req.body;
    
    if (!templateId || !TEMPLATE_FIELDS[templateId]) {
      return res.status(400).json({ 
        success: false, 
        error: 'Modelo de proposta inválido' 
      });
    }

    const templateConfig = TEMPLATE_FIELDS[templateId];
    const templatePath = path.join(__dirname, '../../../templates', templateConfig.file);

    // Verificar se o template existe
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ 
        success: false, 
        error: `Template não encontrado: ${templateConfig.file}` 
      });
    }

    // Preparar dados para substituição (adiciona {{ }} nas chaves)
    const replacementData = {};
    templateConfig.fields.forEach(field => {
      replacementData[field.key] = formData[field.key] || '';
    });

    console.log('Gerando proposta com dados:', replacementData);

    // Gerar documento e converter para PDF
    const pdfBuffer = await documentService.generatePDF(templatePath, replacementData);

    // Definir nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `proposta_${templateId}_${timestamp}.pdf`;

    // Enviar PDF como resposta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar proposta:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar proposta: ' + error.message 
    });
  }
};
