const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const proposalRoutes = require('./routes/proposalRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== TRUST PROXY ====================
// Necessário quando atrás de proxy reverso (Traefik, Nginx, etc)
app.set('trust proxy', 1);

// ==================== SEGURANÇA ====================

// Helmet - Headers de segurança HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - Proteção contra DDoS/Brute Force
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requisições por IP
  message: { 
    success: false, 
    error: 'Muitas requisições. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit mais restrito para geração de PDFs (evita abuso)
const pdfLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 PDFs por minuto por IP
  message: { 
    success: false, 
    error: 'Limite de geração de PDFs excedido. Aguarde 1 minuto.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limit geral
app.use(generalLimiter);

// CORS - Configuração para produção
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (mesmo servidor - frontend servido pelo Express)
    if (!origin) {
      return callback(null, true);
    }
    // Permitir origens configuradas
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Em produção, logar origem rejeitada para debug
    console.log('CORS rejeitado para origem:', origin);
    callback(new Error('Não permitido pelo CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache CORS por 24h
}));

// Limitar tamanho do body (previne ataques de payload grande)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ==================== AUTENTICAÇÃO ====================

// API Key para proteger endpoints sensíveis
// Gere uma chave segura: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const API_KEY = process.env.API_KEY || 'dev-key-change-in-production';

// Middleware de autenticação Bearer Token
const authenticateApiKey = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de autenticação não fornecido' 
    });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer '
  
  if (token !== API_KEY) {
    return res.status(403).json({ 
      success: false, 
      error: 'Token de autenticação inválido' 
    });
  }
  
  next();
};

// ==================== ROTAS ====================

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
}

// Rotas da API com autenticação + rate limit
app.use('/api/proposals', authenticateApiKey, pdfLimiter, proposalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando!' });
});

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📄 API disponível em http://localhost:${PORT}/api`);
});

module.exports = app;
