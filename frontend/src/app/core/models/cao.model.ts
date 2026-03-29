/**
 * Raças de cães suportadas pelo sistema
 */
export type RacaCao =
  | 'Golden Retriever'
  | 'Yorkshire Terrier'
  | 'Poodle'
  | 'Bulldog Francês'
  | 'Pastor Alemão'
  | string;

/**
 * Status do cão (frontend)
 */
export type StatusCao = 'Perdido' | 'Encontrado';

/**
 * Status do relato no backend
 */
export type StatusRelato = 'EM_BUSCA' | 'ENCONTRADO' | 'ARQUIVADO';

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
 * Interface para o modelo de Cão (frontend - UI)
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
 * Interface do Relato retornado pelo backend
 */
export interface RelatoBackend {
  id: string;
  tutor: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    role: string;
  };
  nomeCao: string;
  descricao: string | null;
  fotosUrl: string[];
  latitude: number | null;
  longitude: number | null;
  dataDesaparecimento: string;
  status: StatusRelato;
  porteInformado: string | null;
  corPredominante: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface do Match retornado pelo backend
 */
export interface MatchBackend {
  id: string;
  relato: RelatoBackend;
  avistamento: {
    id: string;
    snapshotUrl: string;
    dataHora: string;
    features: {
      racaEstimada: string | null;
      corPredominante: string | null;
      porteEstimado: string | null;
      confiancaDetecao: number | null;
      caracteristicasExtras: string[] | null;
    } | null;
    cameraOrigem: {
      id: string;
      codigoExterno: string;
      enderecoLogradouro: string | null;
      latitude: number | null;
      longitude: number | null;
      ativa: boolean;
    } | null;
  };
  scoreSimilaridade: number;
  explicacaoLLM: string | null;
  status: 'PENDENTE_ANALISE' | 'CONFIRMADO_PELO_USUARIO' | 'REJEITADO_PELO_USUARIO';
  createdAt: string;
  updatedAt: string;
}

/**
 * Converte RelatoBackend para Cao (frontend)
 */
export function mapRelatoToCao(relato: RelatoBackend): Cao {
  const statusMap: Record<StatusRelato, StatusCao> = {
    'EM_BUSCA': 'Perdido',
    'ENCONTRADO': 'Encontrado',
    'ARQUIVADO': 'Encontrado'
  };

  return {
    id: relato.id,
    nome: relato.nomeCao,
    raca: relato.porteInformado || 'Não informado',
    cor: relato.corPredominante || undefined,
    descricao: relato.descricao || undefined,
    foto: relato.fotosUrl?.[0] || 'assets/images/dog-placeholder.jpg',
    status: statusMap[relato.status] || 'Perdido',
    dataPerdido: new Date(relato.dataDesaparecimento),
    localizacaoPerdido: {
      latitude: relato.latitude || undefined,
      longitude: relato.longitude || undefined,
      endereco: '',
      cidade: '',
      estado: '',
    },
    usuarioId: relato.tutor?.id || '',
    contatoResponsavel: {
      nome: relato.tutor?.nome || 'Não informado',
      telefone: relato.tutor?.telefone || 'Não informado',
      email: relato.tutor?.email || 'Não informado'
    }
  };
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
  fotos: string[];
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
