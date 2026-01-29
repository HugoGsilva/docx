const path = require('path');
const fs = require('fs');
const documentService = require('../services/documentService');

// ==================== FUNÇÕES DE SEGURANÇA ====================

/**
 * Sanitiza string removendo caracteres perigosos
 * Previne XSS e injeção de código
 */
function sanitizeInput(value) {
  if (typeof value !== 'string') {
    return String(value || '');
  }
  
  // Remove tags HTML/XML
  let sanitized = value.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle (exceto espaço, tab, newline)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limita tamanho máximo por campo
  sanitized = sanitized.substring(0, 500);
  
  return sanitized.trim();
}

/**
 * Valida se o templateId é seguro (previne path traversal)
 */
function isValidTemplateId(templateId) {
  // Só permite IDs alfanuméricos com hífen
  return /^[A-Za-z0-9-]+$/.test(templateId);
}

/**
 * Valida formato de data
 */
function isValidDate(dateStr) {
  if (!dateStr) return true; // Campo opcional
  // Formato DD/MM/YYYY ou DD/MM/YY
  return /^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr);
}

/**
 * Valida formato de moeda
 */
function isValidCurrency(value) {
  if (!value) return true; // Campo opcional
  // Aceita: 1.234,56 ou R$ 1.234,56
  return /^(R\$\s?)?\d{1,3}(\.\d{3})*(,\d{2})?$/.test(value);
}

// Mapeamento de campos por modelo
const TEMPLATE_FIELDS = {
  'RPBANK': {
    file: 'modeloB.odt',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date', autoFill: true },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'REQUERENTE', label: 'Requerente', type: 'text' },
      { key: 'NUMEROPROCESSO', label: 'Número do Processo', type: 'text' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency' },
      { key: 'VALORPROPOSTA', label: 'Valor da Proposta', type: 'currency' },
      { key: 'TAXAINTERMEDIACAO', label: 'Taxa de Intermediação', type: 'currency' },
      { key: 'TOTAL', label: 'Valor Total', type: 'currency', calculated: true },
      { key: 'INTERMEDIACAO', label: 'Intermediação (10%)', type: 'currency', calculated: true },
      { key: 'PARCERIA', label: 'Parceria (8%)', type: 'currency', calculated: true },
      { key: 'ESCRITORIO', label: 'Escritório (2%)', type: 'currency', calculated: true }
    ],
    // Campos para nome do arquivo: processo + AC + data
    fileNameFields: { processo: 'NUMEROPROCESSO', nome: 'AC', data: 'DATA' }
  },
  'SD-RESOLV': {
    file: 'MODELOA.ODT',
    fields: [
      { key: 'DATA', label: 'Data', type: 'date', autoFill: true },
      { key: 'AC', label: 'A/C (Aos Cuidados)', type: 'text' },
      { key: 'PROCESSONUMERO', label: 'Número do Processo', type: 'text' },
      { key: 'VALORLIQUIDO', label: 'Valor Líquido', type: 'currency' },
      { key: 'VALORPROPOSTA', label: 'Valor Proposta', type: 'currency' },
      { key: 'VALORINTERMEDIACAO', label: 'Valor de Intermediação', type: 'currency' },
      { key: 'TOTAL', label: 'Total', type: 'currency', calculated: true }
    ],
    fileNameFields: { processo: 'PROCESSONUMERO', nome: 'AC', data: 'DATA' }
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
    
    // ===== VALIDAÇÕES DE SEGURANÇA =====
    
    // Validar templateId (previne path traversal)
    if (!templateId || !isValidTemplateId(templateId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'ID do modelo inválido' 
      });
    }
    
    if (!TEMPLATE_FIELDS[templateId]) {
      return res.status(400).json({ 
        success: false, 
        error: 'Modelo de proposta não encontrado' 
      });
    }
    
    // Validar formData existe
    if (!formData || typeof formData !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados do formulário inválidos' 
      });
    }

    const templateConfig = TEMPLATE_FIELDS[templateId];
    const templatePath = path.join(__dirname, '../../../templates', templateConfig.file);

    // Verificar se o template existe
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ 
        success: false, 
        error: `Template não encontrado` 
      });
    }

    // ===== SANITIZAÇÃO DOS DADOS =====
    const replacementData = {};
    const validationErrors = [];
    
    templateConfig.fields.forEach(field => {
      const rawValue = formData[field.key] || '';
      
      // Sanitizar o valor
      const sanitizedValue = sanitizeInput(rawValue);
      
      // Validar por tipo de campo (pular campos calculados)
      if (!field.calculated) {
        if (field.type === 'date' && sanitizedValue && !isValidDate(sanitizedValue)) {
          validationErrors.push(`${field.label}: formato de data inválido`);
        }
        
        if ((field.type === 'currency' || field.type === 'currency_raw') && sanitizedValue && !isValidCurrency(sanitizedValue)) {
          validationErrors.push(`${field.label}: formato de valor inválido`);
        }
      }
      
      replacementData[field.key] = sanitizedValue;
    });
    
    // Adicionar PROPOSTA como vazio para templates que ainda têm esse placeholder
    if (templateId === 'RPBANK' && !replacementData.PROPOSTA) {
      replacementData.PROPOSTA = '';
    }
    
    // Se houver erros de validação, retornar
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Dados inválidos: ' + validationErrors.join(', ')
      });
    }

    console.log('Gerando proposta com dados:', replacementData);

    // Gerar documento e converter para PDF
    const pdfBuffer = await documentService.generatePDF(templatePath, replacementData);

    // Definir nome do arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `proposta_${templateId}_${timestamp}.pdf`;

    // Enviar PDF como resposta (sem cache)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar proposta:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao gerar proposta: ' + error.message 
    });
  }
};
