import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Camera, CAMERAS_DISPONIVEIS, UploadResponse } from '../models/camera.model';

/**
 * Serviço de gerenciamento de câmeras
 * Responsável por enviar vídeos para o backend
 */
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  
  // ⚙️ CONFIGURAÇÃO: Altere para 'true' para testar SEM backend
  private readonly USE_MOCK_MODE = true; // ← MUDE PARA true PARA TESTAR SEM BACKEND
  
  // URL base da API (usada apenas quando USE_MOCK_MODE = false)
  private readonly API_URL = '/api/cameras';

  /**
   * Retorna todas as câmeras disponíveis
   */
  getCameras(): Camera[] {
    return CAMERAS_DISPONIVEIS;
  }

  /**
   * Retorna uma câmera específica por ID
   */
  getCameraById(id: string): Camera | undefined {
    return CAMERAS_DISPONIVEIS.find(cam => cam.id === id);
  }

  /**
   * Faz upload de vídeo com monitoramento de progresso
   * @param cameraId ID da câmera
   * @param videoFile Arquivo de vídeo
   * @param onProgress Callback para atualizar progresso
   */
  uploadWithProgress(
    cameraId: string, 
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Observable<UploadResponse> {
    // Validações
    const validation = this.validateVideoFile(videoFile);
    if (!validation.valid) {
      return new Observable(observer => {
        observer.error(new Error(validation.error));
      });
    }

    // 🎯 MODO SIMULADO (para testes sem backend)
    if (this.USE_MOCK_MODE) {
      return this.uploadMockMode(cameraId, videoFile, onProgress);
    }

    // 🌐 MODO REAL (requisição para API)
    return this.uploadRealMode(cameraId, videoFile, onProgress);
  }

  /**
   * 🎭 MODO SIMULADO - Simula upload sem backend
   */
  private uploadMockMode(
    cameraId: string,
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Observable<UploadResponse> {
    console.log('🎭 MODO SIMULADO ATIVADO - Simulando upload...');
    console.log('📹 Câmera:', cameraId);
    console.log('📁 Arquivo:', videoFile.name, '(' + this.formatFileSize(videoFile.size) + ')');

    return new Observable<UploadResponse>(observer => {
      let progress = 0;
      
      // Simula progresso gradual
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        
        if (progress > 100) {
          progress = 100;
        }

        // Atualiza callback de progresso
        if (onProgress) {
          onProgress(Math.floor(progress));
        }

        // Quando chega em 100%, finaliza
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Aguarda um pouco para efeito visual
          setTimeout(() => {
            const mockResponse: UploadResponse = {
              success: true,
              message: `✅ Vídeo "${videoFile.name}" enviado com sucesso! (SIMULADO)`,
              cameraId: cameraId,
              fileName: videoFile.name,
              uploadedAt: new Date()
            };

            console.log('✅ Upload simulado concluído:', mockResponse);
            observer.next(mockResponse);
            observer.complete();
          }, 500);
        }
      }, 300); // Atualiza a cada 300ms
    });
  }

  /**
   * 🌐 MODO REAL - Faz upload real para API
   */
  private uploadRealMode(
    cameraId: string,
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Observable<UploadResponse> {
    console.log('🌐 MODO REAL ATIVADO - Enviando para API...');
    console.log('🔗 URL:', `${this.API_URL}/upload`);
    console.log('📹 Câmera:', cameraId);
    console.log('📁 Arquivo:', videoFile.name);

    const formData = new FormData();
    formData.append('cameraId', cameraId);
    formData.append('video', videoFile);

    const uploadUrl = `${this.API_URL}/upload`;

    return new Observable<UploadResponse>(observer => {
      const xhr = new XMLHttpRequest();

      // Monitora o progresso do upload
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
          console.log(`📊 Progresso: ${progress}%`);
        }
      });

      // Upload concluído com sucesso
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('✅ Upload concluído:', response);
            observer.next(response);
            observer.complete();
          } catch (error) {
            console.error('❌ Erro ao processar resposta:', error);
            observer.error(new Error('Erro ao processar resposta do servidor'));
          }
        } else {
          let errorMessage = `Erro HTTP: ${xhr.status}`;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Ignora erro de parse
          }
          console.error('❌ Erro no upload:', errorMessage);
          observer.error(new Error(errorMessage));
        }
      });

      // Erro de conexão
      xhr.addEventListener('error', () => {
        console.error('❌ Erro de conexão com o servidor');
        observer.error(new Error('Erro de conexão com o servidor. Verifique se o backend está rodando.'));
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        console.error('❌ Timeout na requisição');
        observer.error(new Error('Timeout: o servidor demorou muito para responder'));
      });

      // Configura timeout (30 segundos)
      xhr.timeout = 30000;

      // Envia a requisição
      xhr.open('POST', uploadUrl);
      
      // Adicione headers de autenticação se necessário
      // xhr.setRequestHeader('Authorization', 'Bearer seu-token-aqui');
      
      console.log('🚀 Enviando requisição...');
      xhr.send(formData);
    });
  }

  /**
   * Valida se o arquivo é um vídeo válido
   */
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    // Verifica tipo
    if (!file.type.startsWith('video/')) {
      return { valid: false, error: 'O arquivo deve ser um vídeo' };
    }

    // Verifica tamanho (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'O vídeo deve ter no máximo 100MB' };
    }

    // Tipos de vídeo aceitos
    const acceptedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];

    if (!acceptedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Formato não suportado. Use MP4, WebM, MOV ou MKV' 
      };
    }

    return { valid: true };
  }

  /**
   * Formata o tamanho do arquivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}