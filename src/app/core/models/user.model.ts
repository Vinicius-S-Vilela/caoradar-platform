/**
 * Interface para o modelo de Usuário (alinhada com tb_users do backend)
 */
export interface User {
  id: string; // UUID
  nome: string;
  cpf: string;
  email: string;
  senha?: string; // Opcional para não retornar em consultas
  telefone?: string;
  role: 'TUTOR' | 'ADMIN'; // Alinhado com backend
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface para registro de novo usuário (payload para API)
 */
export interface UserRegister {
  nome: string;
  cpf: string;
  email: string;
  senha: string;
  confirmarSenha: string; // Apenas frontend
  telefone?: string;
  role?: 'TUTOR' | 'ADMIN'; // Opcional, default TUTOR
}

/**
 * Interface para login
 */
export interface UserLogin {
  email: string;
  senha: string;
}

/**
 * Interface de resposta da API de registro
 */
export interface UserRegisterResponse {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  role: 'TUTOR' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface de resposta da API de login
 */
export interface UserLoginResponse {
  user: User;
  token?: string; // Para futura implementação JWT
  message?: string;
}