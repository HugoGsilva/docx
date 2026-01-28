// Configuração da API
// Em produção, use variáveis de ambiente do Vite (VITE_API_KEY)
export const API_CONFIG = {
  // API Key para autenticação
  // IMPORTANTE: Em produção, mova para variável de ambiente VITE_API_KEY
  API_KEY: import.meta.env.VITE_API_KEY || 'dev-key-change-in-production',
  
  // URL base da API
  BASE_URL: import.meta.env.VITE_API_URL || '',
};

// Headers padrão para requisições autenticadas
export const getAuthHeaders = () => ({
  'Authorization': `Bearer ${API_CONFIG.API_KEY}`,
  'Content-Type': 'application/json',
});
