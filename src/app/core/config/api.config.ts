/**
 * Configuração da API Backend
 */
export const API_CONFIG = {
  // ⚙️ MODO DE OPERAÇÃO
  // true = Usa dados mockados localmente (sem backend)
  // false = Usa API real do backend
  USE_MOCK_MODE: true, // ← MUDE PARA false PARA USAR API REAL
  
  // 🌐 URL da API Backend
  BASE_URL: 'https://api-caoradar.onrender.com',
  
  // 📡 Endpoints
  ENDPOINTS: {
    USERS: '/users',
    LOGIN: '/auth/login', // Ajuste conforme seu backend
    LOGOUT: '/auth/logout'
  },
  
  // ⏱️ Timeout de requisições (ms)
  TIMEOUT: 30000,
  
  // 🔄 Retry de requisições
  MAX_RETRIES: 3
};

/**
 * Helper para construir URLs completas
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}