/**
 * Interface para o modelo de Câmera
 */
export interface Camera {
  id: string;
  nome: string;
  descricao: string;
  localizacao?: string;
}

/**
 * Interface para o estado local de uma câmera
 * (usado apenas no frontend antes do upload)
 */
export interface CameraState {
  camera: Camera;
  selectedFile: File | null;
  previewUrl: string | null;
  isUploading: boolean;
  uploadProgress: number;
  lastUploadDate: Date | null;
  uploadCount: number;
}

/**
 * Interface para resposta da API de upload
 */
export interface UploadResponse {
  success: boolean;
  message: string;
  cameraId: string;
  fileName: string;
  uploadedAt: Date;
}

/**
 * Lista das 5 câmeras disponíveis no sistema
 */
export const CAMERAS_DISPONIVEIS: Camera[] = [
  {
    id: '1',
    nome: 'Câmera 1',
    descricao: 'Parque Ibirapuera - Entrada Principal',
    localizacao: 'São Paulo, SP'
  },
  {
    id: '2',
    nome: 'Câmera 2',
    descricao: 'Av. Paulista - Próximo ao MASP',
    localizacao: 'São Paulo, SP'
  },
  {
    id: '3',
    nome: 'Câmera 3',
    descricao: 'Shopping Eldorado - Estacionamento',
    localizacao: 'São Paulo, SP'
  },
  {
    id: '4',
    nome: 'Câmera 4',
    descricao: 'Rua Oscar Freire - Centro Comercial',
    localizacao: 'São Paulo, SP'
  },
  {
    id: '5',
    nome: 'Câmera 5',
    descricao: 'Vila Madalena - Praça Benedito Calixto',
    localizacao: 'São Paulo, SP'
  }
];