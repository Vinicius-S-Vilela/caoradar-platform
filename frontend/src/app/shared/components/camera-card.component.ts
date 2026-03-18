import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Camera } from '../../core/models/camera.model';

/**
 * Componente reutilizável de Card de Câmera
 * Gerencia estado local e preview de vídeo
 */
@Component({
  selector: 'app-camera-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="camera-card" [class.has-video]="selectedFile">
      <!-- Header do Card -->
      <div class="camera-header">
        <div class="camera-info">
          <h3>{{camera.nome}}</h3>
          <p class="camera-desc">{{camera.descricao}}</p>
          <p class="camera-location" *ngIf="camera.localizacao">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {{camera.localizacao}}
          </p>
        </div>
        <span class="camera-badge">
          {{selectedFile ? '📹 Vídeo Selecionado' : '⚪ Sem Vídeo'}}
        </span>
      </div>

      <!-- ESTADO INICIAL: Área de Upload -->
      <div class="upload-area" *ngIf="!selectedFile && !isUploading">
        <input
          type="file"
          [id]="'file-input-' + camera.id"
          accept="video/*"
          (change)="onFileSelected($event)"
          style="display: none;"
        >
        <label [for]="'file-input-' + camera.id" class="upload-label">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span class="upload-text">Clique para selecionar vídeo</span>
          <span class="upload-hint">MP4, WebM, MOV até 100MB</span>
        </label>
      </div>

      <!-- ESTADO: Preview do Vídeo Selecionado -->
      <div class="video-preview" *ngIf="selectedFile && !isUploading">
        <!-- Player de Vídeo -->
        <video 
          *ngIf="previewUrl"
          [src]="previewUrl" 
          controls 
          preload="metadata"
          class="video-player"
        >
          Seu navegador não suporta vídeo HTML5.
        </video>

        <!-- Informações do Arquivo -->
        <div class="file-info">
          <div class="file-details">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div class="file-text">
              <strong>{{selectedFile.name}}</strong>
              <span>{{formatFileSize(selectedFile.size)}}</span>
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="action-buttons">
          <button 
            class="btn btn-outline btn-cancel" 
            (click)="cancelSelection()"
            [disabled]="isUploading"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Cancelar
          </button>
          <button 
            class="btn btn-primary btn-send" 
            (click)="sendToServer()"
            [disabled]="isUploading"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Enviar para o Servidor
          </button>
        </div>
      </div>

      <!-- ESTADO: Enviando para o Servidor -->
      <div class="upload-loading" *ngIf="isUploading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Enviando vídeo para o servidor...</p>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="uploadProgress"></div>
        </div>
        <p class="progress-text">{{uploadProgress}}%</p>
      </div>

      <!-- Estatísticas (opcional) -->
      <div class="card-footer" *ngIf="lastUploadDate || uploadCount > 0">
        <div class="footer-info">
          <span *ngIf="uploadCount > 0">
            📊 {{uploadCount}} vídeo(s) enviado(s)
          </span>
          <span *ngIf="lastUploadDate">
            🕒 Último envio: {{lastUploadDate | date:'dd/MM/yyyy HH:mm'}}
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .camera-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      border: 2px solid var(--gray-light);
      transition: all var(--transition-base);
    }

    .camera-card:hover {
      box-shadow: var(--shadow-md);
    }

    .camera-card.has-video {
      border-color: var(--primary-blue);
    }

    .camera-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      gap: 1rem;
    }

    .camera-info h3 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 0.5rem;
      color: var(--gray-dark);
    }

    .camera-desc {
      margin: 0 0 0.25rem;
      font-size: 0.9rem;
      color: var(--gray-text);
    }

    .camera-location {
      margin: 0;
      font-size: 0.85rem;
      color: var(--gray-medium);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .camera-badge {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--secondary-blue);
      color: var(--primary-blue);
      white-space: nowrap;
    }

    /* Área de Upload */
    .upload-area {
      border: 2px dashed var(--gray-light);
      border-radius: var(--radius-md);
      padding: 2.5rem 2rem;
      text-align: center;
      transition: all var(--transition-base);
      cursor: pointer;
    }

    .upload-area:hover {
      border-color: var(--primary-blue);
      background: var(--secondary-blue);
    }

    .upload-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
    }

    .upload-label svg {
      color: var(--primary-blue);
    }

    .upload-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-dark);
    }

    .upload-hint {
      font-size: 0.85rem;
      color: var(--gray-text);
    }

    /* Preview de Vídeo */
    .video-preview {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .video-player {
      width: 100%;
      max-height: 300px;
      border-radius: var(--radius-md);
      background: #000;
      object-fit: contain;
    }

    .file-info {
      padding: 1rem;
      background: var(--secondary-blue);
      border-radius: var(--radius-md);
    }

    .file-details {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .file-details svg {
      flex-shrink: 0;
      color: var(--primary-blue);
    }

    .file-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 0;
    }

    .file-text strong {
      font-size: 0.9rem;
      color: var(--gray-dark);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-text span {
      font-size: 0.8rem;
      color: var(--gray-text);
    }

    /* Botões de Ação */
    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 0.75rem;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.25rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all var(--transition-fast);
      border: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: white;
      color: var(--gray-text);
      border: 2px solid var(--gray-light);
    }

    .btn-cancel:hover:not(:disabled) {
      background: var(--error-red);
      color: white;
      border-color: var(--error-red);
    }

    .btn-send {
      background: var(--primary-blue);
      color: white;
    }

    .btn-send:hover:not(:disabled) {
      background: var(--primary-blue-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    /* Loading de Upload */
    .upload-loading {
      text-align: center;
      padding: 2.5rem 1.5rem;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--gray-light);
      border-top-color: var(--primary-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-dark);
      margin: 0 0 1rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--gray-light);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-blue), var(--primary-blue-light));
      transition: width 0.3s ease;
      border-radius: 4px;
    }

    .progress-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--primary-blue);
      margin: 0;
    }

    /* Footer */
    .card-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--gray-light);
    }

    .footer-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--gray-text);
    }

    /* Responsividade */
    @media (max-width: 768px) {
      .action-buttons {
        grid-template-columns: 1fr;
      }

      .camera-badge {
        font-size: 0.7rem;
        padding: 0.4rem 0.75rem;
      }
    }
  `]
})
export class CameraCardComponent {
  @Input() camera!: Camera;
  @Input() uploadCount: number = 0;
  @Input() lastUploadDate: Date | null = null;
  
  @Output() videoUploaded = new EventEmitter<{ cameraId: string; file: File }>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;

  /**
   * Quando o usuário seleciona um arquivo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Validação básica
    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido.');
      return;
    }

    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert('O vídeo deve ter no máximo 100MB.');
      return;
    }

    // Armazena o arquivo e cria preview
    this.selectedFile = file;
    this.createPreview(file);

    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    input.value = '';
  }

  /**
   * Cria URL de preview do vídeo
   */
  private createPreview(file: File): void {
    // Revoga URL anterior se existir
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    // Cria nova URL
    this.previewUrl = URL.createObjectURL(file);
  }

  /**
   * Cancela a seleção e limpa o preview
   */
  cancelSelection(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }

    this.selectedFile = null;
    this.previewUrl = null;
    this.uploadProgress = 0;
  }

  /**
   * Envia o vídeo para o servidor
   */
  sendToServer(): void {
    if (!this.selectedFile) {
      return;
    }

    // Emite evento para o componente pai fazer o upload
    this.videoUploaded.emit({
      cameraId: this.camera.id,
      file: this.selectedFile
    });
  }

  /**
   * Método público para iniciar o loading (chamado pelo componente pai)
   */
  startUpload(): void {
    this.isUploading = true;
    this.uploadProgress = 0;
  }

  /**
   * Método público para atualizar o progresso (chamado pelo componente pai)
   */
  updateProgress(progress: number): void {
    this.uploadProgress = Math.min(Math.max(progress, 0), 100);
  }

  /**
   * Método público para finalizar o upload (chamado pelo componente pai)
   */
  completeUpload(): void {
    this.uploadProgress = 100;
    
    setTimeout(() => {
      this.resetCard();
    }, 500);
  }

  /**
   * Método público para tratar erro no upload (chamado pelo componente pai)
   */
  uploadError(): void {
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  /**
   * Reseta o card para o estado inicial
   */
  private resetCard(): void {
    this.cancelSelection();
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  /**
   * Formata o tamanho do arquivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  ngOnDestroy(): void {
    // Limpa a URL ao destruir o componente
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}