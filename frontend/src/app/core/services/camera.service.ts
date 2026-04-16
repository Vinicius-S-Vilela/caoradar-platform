import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Camera, UploadResponse } from '../models/camera.model';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CameraService {

  private cameras: Camera[] = [];
  private camerasLoaded = false;

  private readonly cloudinaryVideoUrl = `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/video/upload`;
  private readonly uploadPreset = environment.cloudinary.uploadPreset;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  /**
   * Busca câmeras do banco via API do backend
   */
  loadCameras(): Observable<Camera[]> {
    return this.api.get<Camera[]>('/cameras/ativas').pipe(
      switchMap(cameras => {
        this.cameras = cameras.map(cam => ({
          ...cam,
          nome: cam.codigoExterno,
          descricao: cam.enderecoLogradouro || 'Sem endereço',
          localizacao: this.extrairCidade(cam.enderecoLogradouro)
        }));
        this.camerasLoaded = true;
        return of(this.cameras);
      }),
      catchError(err => {
        console.error('Erro ao carregar câmeras:', err);
        return of([]);
      })
    );
  }

  /**
   * Retorna câmeras já carregadas (sync)
   */
  getCameras(): Camera[] {
    return this.cameras;
  }

  /**
   * Retorna uma câmera específica por ID
   */
  getCameraById(id: string): Camera | undefined {
    return this.cameras.find(cam => cam.id === id);
  }

  /**
   * Fluxo completo:
   * 1. Upload vídeo para Cloudinary
   * 2. Envia URL + cameraId para backend → IA Service
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

    return new Observable<UploadResponse>(observer => {
      // ETAPA 1: Upload do vídeo para Cloudinary
      console.log('☁️ Etapa 1: Enviando vídeo para Cloudinary...');

      const formData = new FormData();
      formData.append('file', videoFile);
      formData.append('upload_preset', this.uploadPreset);
      formData.append('folder', 'cao_radar/videos');
      formData.append('resource_type', 'video');

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          // Cloudinary upload = 0-80% do progresso total
          const progress = Math.round((event.loaded / event.total) * 80);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const cloudinaryResponse = JSON.parse(xhr.responseText);
            const videoUrl = cloudinaryResponse.secure_url;
            console.log('✅ Vídeo no Cloudinary:', videoUrl);

            if (onProgress) onProgress(85);

            // ETAPA 2: Enviar para processamento (Backend → IA)
            console.log('🤖 Etapa 2: Enviando para processamento IA...');

            // Buscar codigoExterno da câmera
            const camera = this.cameras.find(c => c.id === cameraId);
            const codigoCamera = camera?.codigoExterno || cameraId;

            this.api.post<any>('/api/video/processar', {
              cameraId: codigoCamera,
              videoUrl: videoUrl,
              dataHora: new Date().toISOString()
            }).subscribe({
              next: (iaResponse) => {
                console.log('✅ IA processou:', iaResponse);
                if (onProgress) onProgress(100);

                const avistamentos = iaResponse?.avistamentos || [];
                observer.next({
                  success: true,
                  message: `Vídeo processado! ${avistamentos.length} cão(es) detectado(s).`,
                  cameraId: cameraId,
                  fileName: videoFile.name,
                  uploadedAt: new Date(),
                  avistamentos: avistamentos
                });
                observer.complete();
              },
              error: (err) => {
                console.error('❌ Erro no processamento IA:', err);
                // Vídeo foi para Cloudinary, mas IA falhou
                observer.next({
                  success: true,
                  message: `Vídeo enviado ao Cloudinary, mas o processamento IA falhou: ${err.message}`,
                  cameraId: cameraId,
                  fileName: videoFile.name,
                  uploadedAt: new Date()
                });
                observer.complete();
              }
            });

          } catch (error) {
            observer.error(new Error('Erro ao processar resposta do Cloudinary'));
          }
        } else {
          observer.error(new Error(`Erro no upload do Cloudinary: HTTP ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        observer.error(new Error('Erro de conexão com Cloudinary'));
      });

      xhr.timeout = 300000; // 5 minutos para vídeos grandes
      xhr.addEventListener('timeout', () => {
        observer.error(new Error('Timeout no upload do vídeo'));
      });

      xhr.open('POST', this.cloudinaryVideoUrl);
      xhr.send(formData);
    });
  }

  /**
   * Valida se o arquivo é um vídeo válido
   */
  validateVideoFile(file: File): { valid: boolean; error?: string } {
    if (!file.type.startsWith('video/')) {
      return { valid: false, error: 'O arquivo deve ser um vídeo' };
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return { valid: false, error: 'O vídeo deve ter no máximo 100MB' };
    }

    const acceptedTypes = [
      'video/mp4', 'video/webm', 'video/ogg',
      'video/quicktime', 'video/x-msvideo', 'video/x-matroska'
    ];

    if (!acceptedTypes.includes(file.type)) {
      return { valid: false, error: 'Formato não suportado. Use MP4, WebM, MOV ou MKV' };
    }

    return { valid: true };
  }

  /**
   * Extrai a cidade do endereço
   */
  private extrairCidade(endereco: string | null): string {
    if (!endereco) return '';
    // Tenta extrair "Cidade - UF" do endereço
    const match = endereco.match(/([^,]+- SP)/);
    return match ? match[1].trim() : endereco.split(',').pop()?.trim() || '';
  }
}
