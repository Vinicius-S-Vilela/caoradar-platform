import { Component, OnInit, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraCardComponent } from '../../shared/components/camera-card.component';
import { CameraService } from '../../core/services/camera.service';
import { Camera } from '../../core/models/camera.model';
import { NotificationService } from '../../core/services/notification.service';

/**
 * Componente de gerenciamento de câmeras do painel admin
 */
@Component({
  selector: 'app-admin-cameras',
  standalone: true,
  imports: [CommonModule, CameraCardComponent],
  template: `
    <div class="cameras-section">
      <!-- Header -->
      <div class="section-header">
        <div>
          <h2>🎥 Gerenciamento de Câmeras</h2>
          <p>Faça upload de vídeos das câmeras de monitoramento</p>
        </div>
      </div>

      <!-- Instruções -->
      <div class="instructions-box">
        <div class="instruction-icon">ℹ️</div>
        <div class="instruction-content">
          <h3>Como funciona</h3>
          <ol>
            <li>Selecione um vídeo clicando em "Upload de vídeo"</li>
            <li>Visualize o preview do vídeo selecionado</li>
            <li>Clique em "Enviar para o servidor" para fazer o upload</li>
            <li>Após o envio, o card será resetado para um novo upload</li>
          </ol>
          <p class="instruction-note">
            <strong>Nota:</strong> Cada câmera pode enviar vários vídeos, mas apenas um de cada vez.
          </p>
        </div>
      </div>

      <!-- Estatísticas -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📹</div>
          <div class="stat-info">
            <h3>{{cameras.length}}</h3>
            <p>Câmeras Disponíveis</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📤</div>
          <div class="stat-info">
            <h3>{{getTotalUploads()}}</h3>
            <p>Vídeos Enviados</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <h3>{{getSuccessRate()}}%</h3>
            <p>Taxa de Sucesso</p>
          </div>
        </div>
      </div>

      <!-- Grid de Câmeras -->
      <div class="cameras-grid">
        <app-camera-card
          *ngFor="let camera of cameras; let i = index"
          [camera]="camera"
          [uploadCount]="uploadStats[camera.id]?.count || 0"
          [lastUploadDate]="uploadStats[camera.id]?.lastDate || null"
          (videoUploaded)="onVideoUpload($event, i)"
        ></app-camera-card>
      </div>

      <!-- Aviso sobre Backend -->
      <div class="backend-warning">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <div>
          <p><strong>Configuração da API:</strong></p>
          <p>
            Por padrão, o sistema está configurado para enviar requisições POST para
            <code>/api/cameras/upload</code>. 
          </p>
          <p>
            Configure a URL da API no arquivo 
            <code>src/app/core/services/camera.service.ts</code> alterando a constante
            <code>API_URL</code>.
          </p>
          <p>
            <strong>Para testar sem backend:</strong> Descomente o bloco de código "MÉTODO 2"
            no serviço para usar upload simulado.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cameras-section {
      padding: 0;
    }

    .section-header {
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 1.75rem;
      margin: 0 0 0.5rem;
      color: var(--gray-dark);
    }

    .section-header p {
      margin: 0;
      color: var(--gray-text);
    }

    /* Instruções */
    .instructions-box {
      display: flex;
      gap: 1.5rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, var(--secondary-blue), #ffffff);
      border: 2px solid var(--primary-blue);
      border-radius: var(--radius-lg);
      margin-bottom: 2rem;
    }

    .instruction-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .instruction-content h3 {
      margin: 0 0 1rem;
      font-size: 1.1rem;
      color: var(--gray-dark);
    }

    .instruction-content ol {
      margin: 0 0 1rem;
      padding-left: 1.5rem;
      color: var(--gray-text);
    }

    .instruction-content ol li {
      margin-bottom: 0.5rem;
    }

    .instruction-note {
      margin: 0;
      padding: 0.75rem 1rem;
      background: white;
      border-left: 3px solid var(--primary-blue);
      border-radius: var(--radius-sm);
      font-size: 0.9rem;
      color: var(--gray-text);
    }

    /* Estatísticas */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 1.5rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      border: 2px solid var(--gray-light);
    }

    .stat-icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .stat-info h3 {
      font-size: 2rem;
      margin: 0 0 0.25rem;
      color: var(--primary-blue);
      font-weight: 700;
    }

    .stat-info p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--gray-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Grid de Câmeras */
    .cameras-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    /* Aviso sobre Backend */
    .backend-warning {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      border-radius: var(--radius-md);
    }

    .backend-warning svg {
      flex-shrink: 0;
      color: #FF9800;
      margin-top: 0.25rem;
    }

    .backend-warning p {
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
      color: var(--gray-dark);
      line-height: 1.6;
    }

    .backend-warning p:last-child {
      margin-bottom: 0;
    }

    .backend-warning code {
      padding: 0.2rem 0.5rem;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #D63031;
    }

    /* Responsividade */
    @media (max-width: 768px) {
      .cameras-grid {
        grid-template-columns: 1fr;
      }

      .instructions-box {
        flex-direction: column;
      }

      .instruction-icon {
        font-size: 2rem;
      }
    }
  `]
})
export class AdminCamerasComponent implements OnInit {
  @ViewChildren(CameraCardComponent) cameraCards!: QueryList<CameraCardComponent>;

  cameras: Camera[] = [];
  
  // Estatísticas de upload por câmera
  uploadStats: {
    [cameraId: string]: {
      count: number;
      lastDate: Date | null;
    }
  } = {};

  // Contador de sucessos e erros
  totalSuccess: number = 0;
  totalErrors: number = 0;

  constructor(
    private cameraService: CameraService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cameraService.loadCameras().subscribe(cameras => {
      this.cameras = cameras;
      this.initializeStats();
    });
  }

  /**
   * Inicializa estatísticas
   */
  private initializeStats(): void {
    this.cameras.forEach(camera => {
      this.uploadStats[camera.id] = {
        count: 0,
        lastDate: null
      };
    });
  }

  /**
   * Quando o usuário clica em "Enviar para o Servidor"
   */
  onVideoUpload(event: { cameraId: string; file: File }, cardIndex: number): void {
    const { cameraId, file } = event;
    const card = this.cameraCards.toArray()[cardIndex];

    // Inicia o loading no card
    card.startUpload();

    // Faz o upload real para o servidor
    this.cameraService.uploadWithProgress(
      cameraId,
      file,
      (progress) => {
        // Atualiza o progresso
        card.updateProgress(progress);
      }
    ).subscribe({
      next: (response) => {
        console.log('✅ Upload bem-sucedido:', response);
        
        // Atualiza estatísticas
        this.uploadStats[cameraId].count++;
        this.uploadStats[cameraId].lastDate = new Date();
        this.totalSuccess++;

        // Completa o upload e reseta o card
        card.completeUpload();

        // Mostra mensagem de sucesso
        this.showSuccessMessage(response.message || 'Vídeo enviado com sucesso!');
      },
      error: (error) => {
        console.error('❌ Erro no upload:', error);
        
        this.totalErrors++;
        
        // Marca erro no card
        card.uploadError();

        // Mostra mensagem de erro
        this.showErrorMessage(error.message || 'Erro ao enviar vídeo para o servidor');
      }
    });
  }

  /**
   * Retorna o total de uploads realizados
   */
  getTotalUploads(): number {
    return Object.values(this.uploadStats).reduce((sum, stat) => sum + stat.count, 0);
  }

  /**
   * Retorna a taxa de sucesso dos uploads
   */
  getSuccessRate(): number {
    const total = this.totalSuccess + this.totalErrors;
    if (total === 0) return 100;
    return Math.round((this.totalSuccess / total) * 100);
  }

  private showSuccessMessage(message: string): void {
    this.notificationService.show('success', 'Upload concluido', message, 8000);
  }

  private showErrorMessage(message: string): void {
    this.notificationService.show('error', 'Erro no upload', message, 8000);
  }
}