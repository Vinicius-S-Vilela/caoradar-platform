/**
 * Interface para o modelo de Câmera (vindo do backend/banco)
 */
export interface Camera {
  id: string;
  codigoExterno: string;
  enderecoLogradouro: string;
  latitude: number;
  longitude: number;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos computados no frontend para compatibilidade com UI
  nome?: string;
  descricao?: string;
  localizacao?: string;
}

/**
 * Interface para o estado local de uma câmera
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
  avistamentos?: any[];
}
