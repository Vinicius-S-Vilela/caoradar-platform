/**
 * Raças de cães suportadas pelo sistema
 */
export type RacaCao = 
  | 'Golden Retriever'
  | 'Yorkshire Terrier'
  | 'Poodle'
  | 'Bulldog Francês'
  | 'Pastor Alemão';

/**
 * Status do cão
 */
export type StatusCao = 'Perdido' | 'Encontrado';

/**
 * Interface para localização
 */
export interface Localizacao {
  latitude?: number;
  longitude?: number;
  endereco: string;
  cidade: string;
  estado: string;
  bairro?: string;
}

/**
 * Interface para o modelo de Cão
 */
export interface Cao {
  id: string;
  nome: string;
  raca: RacaCao;
  idade?: number;
  sexo?: 'Macho' | 'Fêmea';
  cor?: string;
  descricao?: string;
  foto: string;
  status: StatusCao;
  dataPerdido: Date;
  dataEncontrado?: Date;
  localizacaoPerdido: Localizacao;
  localizacaoEncontrado?: Localizacao;
  usuarioId: string;
  contatoResponsavel: {
    nome: string;
    telefone: string;
    email: string;
  };
  observacoes?: string;
  recompensa?: number;
}

/**
 * Interface para cadastro de cão perdido
 */
export interface CaoCadastro {
  nome: string;
  raca: RacaCao;
  idade?: number;
  sexo?: 'Macho' | 'Fêmea';
  cor?: string;
  descricao?: string;
  foto: string;
  dataPerdido: Date;
  localizacao: Localizacao;
  contatoResponsavel: {
    nome: string;
    telefone: string;
    email: string;
  };
  observacoes?: string;
  recompensa?: number;
}

/**
 * Constante com as raças disponíveis
 */
export const RACAS_DISPONIVEIS: RacaCao[] = [
  'Golden Retriever',
  'Yorkshire Terrier',
  'Poodle',
  'Bulldog Francês',
  'Pastor Alemão'
];
