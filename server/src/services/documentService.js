const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const libre = require('libreoffice-convert');
const { promisify } = require('util');
const { execFile } = require('child_process');

// Configurar caminho do LibreOffice para Windows
const SOFFICE_PATH = process.platform === 'win32' 
  ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
  : '/usr/bin/soffice';

// Verificar se existe
if (fs.existsSync(SOFFICE_PATH)) {
  console.log(`✅ LibreOffice encontrado em: ${SOFFICE_PATH}`);
} else {
  console.warn(`⚠️ LibreOffice não encontrado em: ${SOFFICE_PATH}`);
}

const libreConvert = promisify(libre.convert);

/**
 * Converte documento para PDF usando LibreOffice diretamente
 */
async function convertToPdfWithLibreOffice(inputBuffer, inputExt) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Usar timestamp + random para evitar conflitos de cache
    const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const inputFile = path.join(tempDir, `input_${uniqueId}${inputExt}`);
    const outputFile = path.join(tempDir, `input_${uniqueId}.pdf`);

    // Salvar arquivo de entrada
    fs.writeFileSync(inputFile, inputBuffer);

    // Executar LibreOffice
    const args = [
      '--headless',
      '--convert-to', 'pdf',
      '--outdir', tempDir,
      inputFile
    ];

    execFile(SOFFICE_PATH, args, { timeout: 60000 }, (error, stdout, stderr) => {
      // Limpar arquivo de entrada
      try { fs.unlinkSync(inputFile); } catch (e) {}

      if (error) {
        console.error('Erro LibreOffice:', stderr);
        reject(new Error(`Erro na conversão: ${stderr || error.message}`));
        return;
      }

      // Ler PDF gerado
      if (fs.existsSync(outputFile)) {
        const pdfBuffer = fs.readFileSync(outputFile);
        try { fs.unlinkSync(outputFile); } catch (e) {}
        resolve(pdfBuffer);
      } else {
        reject(new Error('PDF não foi gerado'));
      }
    });
  });
}

/**
 * Gera um PDF a partir de um template (DOCX ou ODT) com os dados fornecidos
 * @param {string} templatePath - Caminho para o arquivo template
 * @param {object} data - Dados para substituição das tags
 * @returns {Promise<Buffer>} - Buffer do PDF gerado
 */
async function generatePDF(templatePath, data) {
  const ext = path.extname(templatePath).toLowerCase();
  
  let filledDocBuffer;
  
  if (ext === '.docx') {
    filledDocBuffer = await fillDocxTemplate(templatePath, data);
  } else if (ext === '.odt') {
    filledDocBuffer = await fillOdtTemplate(templatePath, data);
  } else {
    throw new Error(`Formato de arquivo não suportado: ${ext}`);
  }

  // Converter para PDF usando LibreOffice diretamente
  console.log('Convertendo para PDF com LibreOffice...');
  const pdfBuffer = await convertToPdfWithLibreOffice(filledDocBuffer, ext);
  console.log('PDF gerado com sucesso!');
  
  return pdfBuffer;
}

/**
 * Preenche template DOCX com docxtemplater
 */
async function fillDocxTemplate(templatePath, data) {
  // Forçar leitura fresh do arquivo (sem cache)
  const fd = fs.openSync(templatePath, 'r');
  const stats = fs.fstatSync(fd);
  const content = Buffer.alloc(stats.size);
  fs.readSync(fd, content, 0, stats.size, 0);
  fs.closeSync(fd);
  
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' }
  });

  // Substituir tags
  doc.render(data);

  // Gerar buffer do documento preenchido
  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  return buffer;
}

/**
 * Preenche template ODT (similar ao DOCX, pois ODT também é baseado em XML/ZIP)
 */
async function fillOdtTemplate(templatePath, data) {
  // Forçar leitura fresh do arquivo (sem cache)
  const fd = fs.openSync(templatePath, 'r');
  const stats = fs.fstatSync(fd);
  const content = Buffer.alloc(stats.size);
  fs.readSync(fd, content, 0, stats.size, 0);
  fs.closeSync(fd);
  
  const zip = new PizZip(content);
  
  // ODT usa content.xml para o conteúdo principal
  const contentXml = zip.file('content.xml');
  if (!contentXml) {
    throw new Error('Arquivo ODT inválido: content.xml não encontrado');
  }

  let xmlContent = contentXml.asText();
  console.log('Substituindo placeholders com dados:', JSON.stringify(data, null, 2));
  
  // Substituir placeholders {{KEY}} pelos valores
  Object.entries(data).forEach(([key, value]) => {
    // Regex para encontrar {{KEY}} mesmo com possíveis tags XML no meio
    const simpleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    xmlContent = xmlContent.replace(simpleRegex, escapeXml(value || ''));
    
    // Tentar também com possíveis espaços
    const spacedRegex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    xmlContent = xmlContent.replace(spacedRegex, escapeXml(value || ''));
  });

  // Atualizar o content.xml no ZIP
  zip.file('content.xml', xmlContent);

  // Gerar buffer do documento preenchido
  const buffer = zip.generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  return buffer;
}

/**
 * Escapa caracteres especiais para XML
 */
function escapeXml(str) {
  if (typeof str !== 'string') {
    str = String(str);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  generatePDF,
  fillDocxTemplate,
  fillOdtTemplate
};
