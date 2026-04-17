/**
 * Interface para o modelo de Usuário (frontend)
 */
export interface User {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  isAdmin: boolean;
  telefone?: string;
  dataCadastro: Date;
  avatar?: string;
}

/**
 * Interface do Usuário retornado pelo backend
 */
export interface UserBackend {
  id: string;
  nome: string;
  email: string;
  passwordHash: string;
  telefone: string | null;
  role: 'ADMIN' | 'TUTOR';
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface para registro de novo usuário
 */
export interface UserRegister {
  nome: string;
  email: string;
  cpf: string;
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

/**
 * Converte UserBackend para User (frontend)
 */
export function mapBackendUserToUser(backendUser: UserBackend): User {
  return {
    id: backendUser.id,
    nome: backendUser.nome,
    email: backendUser.email,
    isAdmin: backendUser.role === 'ADMIN',
    telefone: backendUser.telefone || undefined,
    dataCadastro: new Date(backendUser.createdAt)
  };
}
