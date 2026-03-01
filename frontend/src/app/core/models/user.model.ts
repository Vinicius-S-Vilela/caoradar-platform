/**
 * Interface para o modelo de Usuário
 */
export interface User {
  id: string;
  nome: string;
  email: string;
  senha?: string; // Opcional para não retornar em consultas
  isAdmin: boolean;
  telefone?: string;
  dataCadastro: Date;
  avatar?: string;
}

/**
 * Interface para registro de novo usuário
 */
export interface UserRegister {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  telefone?: string;
}

/**
 * Interface para login
 */
export interface UserLogin {
  email: string;
  senha: string;
}
