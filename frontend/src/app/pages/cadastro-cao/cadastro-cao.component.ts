import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { NotificationService } from '../../core/services/notification.service';
import { RACAS_DISPONIVEIS, MatchBackend } from '../../core/models/cao.model';

@Component({
  selector: 'app-cadastro-cao',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container" style="max-width: 700px;">

        <!-- OVERLAY DE LOADING / RESULTADO DA IA -->
        <div class="ia-overlay" *ngIf="iaProcessing || iaResult !== null">
          <div class="ia-modal">
            <!-- PROCESSANDO -->
            <ng-container *ngIf="iaProcessing">
              <div class="ia-spinner-wrap">
                <div class="ia-spinner"></div>
                <div class="ia-pulse"></div>
              </div>
              <h2>Analisando com IA...</h2>
              <p class="ia-subtitle">{{ iaStepMessage }}</p>
              <div class="ia-steps">
                <div class="ia-step" [class.active]="iaStep >= 1" [class.done]="iaStep > 1">
                  <span class="step-dot"></span> Enviando fotos
                </div>
                <div class="ia-step" [class.active]="iaStep >= 2" [class.done]="iaStep > 2">
                  <span class="step-dot"></span> Cadastrando relato
                </div>
                <div class="ia-step" [class.active]="iaStep >= 3" [class.done]="iaStep > 3">
                  <span class="step-dot"></span> Buscando matches na IA
                </div>
              </div>
            </ng-container>

            <!-- RESULTADO -->
            <ng-container *ngIf="!iaProcessing && iaResult !== null">
              <!-- COM MATCH -->
              <ng-container *ngIf="iaMatches.length > 0">
                <div class="result-icon match-found">&#128062;</div>
                <h2>Match Encontrado!</h2>
                <p class="ia-subtitle">Encontramos {{ iaMatches.length }} possivel(is) match(es) para o seu cao</p>
                <div class="match-cards">
                  <div class="match-card" *ngFor="let match of iaMatches">
                    <img [src]="match.avistamento.snapshotUrl || 'assets/images/dog-placeholder.jpg'" alt="Avistamento"
                         class="match-img"
                         onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
                    <div class="match-info">
                      <span class="match-score-badge" [class.high]="match.scoreSimilaridade >= 0.75" [class.medium]="match.scoreSimilaridade >= 0.4 && match.scoreSimilaridade < 0.75">
                        {{ (match.scoreSimilaridade * 100).toFixed(0) }}%
                      </span>
                      <p class="match-detail" *ngIf="match.avistamento.cameraOrigem?.enderecoLogradouro">
                        {{ match.avistamento.cameraOrigem?.enderecoLogradouro }}
                      </p>
                      <p class="match-detail" *ngIf="match.avistamento.features?.racaEstimada">
                        Raca: {{ match.avistamento.features?.racaEstimada }}
                      </p>
                      <p class="match-explain" *ngIf="match.explicacaoLLM">
                        {{ match.explicacaoLLM.length > 100 ? match.explicacaoLLM.substring(0, 100) + '...' : match.explicacaoLLM }}
                      </p>
                    </div>
                  </div>
                </div>
                <button class="btn btn-primary" (click)="goToMatches()" style="margin-top: 1.5rem;">
                  Ver Matches
                </button>
              </ng-container>

              <!-- SEM MATCH -->
              <ng-container *ngIf="iaMatches.length === 0">
                <div class="result-icon no-match">&#128269;</div>
                <h2>Nenhum match encontrado</h2>
                <p class="ia-subtitle">
                  Nao encontramos nenhum avistamento parecido com o seu cao no momento.
                  Voce sera notificado assim que houver um novo match!
                </p>
                <button class="btn btn-primary" (click)="goToDashboard()" style="margin-top: 1.5rem;">
                  Ir para Meus Caes
                </button>
              </ng-container>
            </ng-container>
          </div>
        </div>

        <div class="page-header">
          <h1>Cadastrar Cao Perdido</h1>
          <p>Preencha as informacoes do cao para iniciar a busca</p>
        </div>

        <div class="card" style="padding: 2rem;">
          <form [formGroup]="cadastroForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Nome do cao *</label>
              <input type="text" class="form-control" formControlName="nome" placeholder="Ex: Rex">
            </div>

            <div class="form-group">
              <label class="form-label">Raca *</label>
              <select class="form-control" formControlName="raca">
                <option value="">Selecione a raca</option>
                <option *ngFor="let raca of racas" [value]="raca">{{raca}}</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Idade</label>
                <input type="number" class="form-control" formControlName="idade" placeholder="Anos">
              </div>
              <div class="form-group">
                <label class="form-label">Sexo</label>
                <select class="form-control" formControlName="sexo">
                  <option value="">Selecione</option>
                  <option value="Macho">Macho</option>
                  <option value="Femea">Femea</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Cor</label>
              <input type="text" class="form-control" formControlName="cor" placeholder="Ex: Dourado">
            </div>

            <div class="form-group">
              <label class="form-label">Porte</label>
              <select class="form-control" formControlName="porte">
                <option value="">Selecione</option>
                <option value="Pequeno">Pequeno</option>
                <option value="Medio">Medio</option>
                <option value="Grande">Grande</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Descricao</label>
              <textarea class="form-control" formControlName="descricao" rows="3"
                placeholder="Caracteristicas, comportamento, etc."></textarea>
            </div>

            <!-- Upload de fotos -->
            <div class="form-group">
              <label class="form-label">Fotos do cao *</label>

              <div class="upload-area" (click)="fileInput.click()"
                   [class.has-files]="selectedFiles.length > 0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Clique para selecionar imagens</p>
                <small>JPG, PNG ou WEBP</small>
              </div>

              <input #fileInput type="file" accept="image/*" multiple hidden
                     (change)="onFilesSelected($event)">

              <div class="previews" *ngIf="previewUrls.length > 0">
                <div class="preview-item" *ngFor="let url of previewUrls; let i = index">
                  <img [src]="url" alt="Preview">
                  <button type="button" class="remove-btn" (click)="removeFile(i)">&times;</button>
                </div>
              </div>

              <small *ngIf="selectedFiles.length === 0" style="color: var(--error-red);">
                Selecione ao menos uma foto
              </small>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Localizacao onde foi perdido</h3>

            <div class="form-group">
              <label class="form-label">Endereco *</label>
              <input type="text" class="form-control" formControlName="endereco" placeholder="Rua, numero">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Bairro</label>
                <input type="text" class="form-control" formControlName="bairro" placeholder="Bairro">
              </div>
              <div class="form-group">
                <label class="form-label">Cidade *</label>
                <input type="text" class="form-control" formControlName="cidade" placeholder="Cidade">
              </div>
              <div class="form-group">
                <label class="form-label">Estado *</label>
                <input type="text" class="form-control" formControlName="estado" placeholder="UF" maxlength="2">
              </div>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Contato do Responsavel</h3>

            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-control" formControlName="contatoNome" placeholder="Seu nome">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telefone *</label>
                <input type="tel" class="form-control" formControlName="contatoTelefone" placeholder="(00) 00000-0000">
              </div>
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" formControlName="contatoEmail" placeholder="email@exemplo.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Observacoes</label>
              <textarea class="form-control" formControlName="observacoes" rows="2"
                placeholder="Informacoes adicionais"></textarea>
            </div>

            <div *ngIf="errorMessage" class="error-banner">{{ errorMessage }}</div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline" routerLink="/dashboard" style="flex: 1;">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary"
                      [disabled]="cadastroForm.invalid || selectedFiles.length === 0 || loading"
                      style="flex: 1;">
                {{ loading ? 'Processando...' : 'Cadastrar Cao' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .form-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }
    @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }

    .upload-area {
      border: 2px dashed var(--gray-border, #ccc);
      border-radius: var(--radius-md, 8px);
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      color: var(--gray-text);
      transition: border-color 0.2s, background 0.2s;
    }
    .upload-area:hover, .upload-area.has-files {
      border-color: var(--primary-blue);
      background: rgba(var(--primary-blue-rgb, 0, 100, 255), 0.04);
    }
    .upload-area p { margin: 0.5rem 0 0.25rem; font-size: 0.95rem; }
    .upload-area small { font-size: 0.8rem; }

    .previews { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; }
    .preview-item { position: relative; width: 90px; height: 90px; }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-sm, 6px); border: 1px solid var(--gray-border, #ccc); }
    .remove-btn {
      position: absolute; top: -6px; right: -6px; width: 22px; height: 22px;
      border-radius: 50%; background: var(--error-red, #eb5757); color: white;
      border: none; cursor: pointer; font-size: 14px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
    }

    .error-banner {
      margin-top: 1rem; padding: 0.75rem 1rem;
      background: rgba(235, 87, 87, 0.1); color: var(--error-red, #eb5757);
      border: 1px solid rgba(235, 87, 87, 0.3); border-radius: var(--radius-md, 8px);
      font-size: 0.9rem;
    }

    /* IA OVERLAY */
    .ia-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px);
      z-index: 2000; display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .ia-modal {
      background: white; border-radius: 20px; padding: 2.5rem;
      max-width: 500px; width: 90%; text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: scaleIn 0.3s ease;
    }
    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .ia-modal h2 { font-size: 1.5rem; margin: 1rem 0 0.5rem; color: var(--gray-dark, #333); }
    .ia-subtitle { color: #666; font-size: 0.95rem; margin: 0; line-height: 1.5; }

    .ia-spinner-wrap { position: relative; width: 80px; height: 80px; margin: 0 auto; }
    .ia-spinner {
      width: 80px; height: 80px; border: 4px solid #e0e0e0;
      border-top-color: var(--primary-blue, #2980b9); border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    .ia-pulse {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 40px; height: 40px; background: var(--primary-blue, #2980b9);
      border-radius: 50%; animation: pulse 1.5s ease-in-out infinite; opacity: 0.3;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.3; } 50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; } }

    .ia-steps { margin-top: 1.5rem; text-align: left; display: inline-block; }
    .ia-step {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.5rem 0; color: #aaa; font-size: 0.9rem;
      transition: color 0.3s;
    }
    .ia-step.active { color: var(--primary-blue, #2980b9); font-weight: 600; }
    .ia-step.done { color: #27ae60; }
    .step-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #ddd;
      flex-shrink: 0; transition: background 0.3s;
    }
    .ia-step.active .step-dot { background: var(--primary-blue, #2980b9); }
    .ia-step.done .step-dot { background: #27ae60; }

    /* RESULTADO */
    .result-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
    .result-icon.match-found { animation: bounceIn 0.5s ease; }
    .result-icon.no-match { opacity: 0.6; }
    @keyframes bounceIn {
      0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); }
    }

    .match-cards { margin-top: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .match-card {
      display: flex; gap: 1rem; padding: 0.75rem;
      background: #f7fafc; border-radius: 12px; border: 1px solid #e2e8f0;
      text-align: left;
    }
    .match-img { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
    .match-info { flex: 1; min-width: 0; }
    .match-score-badge {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px;
      font-size: 0.8rem; font-weight: 700; background: #e0e0e0; color: #555;
    }
    .match-score-badge.high { background: #d4edda; color: #155724; }
    .match-score-badge.medium { background: #fff3cd; color: #856404; }
    .match-detail { margin: 0.25rem 0 0; font-size: 0.8rem; color: #666; }
    .match-explain { margin: 0.25rem 0 0; font-size: 0.75rem; color: #888; font-style: italic; }
  `]
})
export class CadastroCaoComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  cadastroForm: FormGroup;
  racas = RACAS_DISPONIVEIS;
  loading = false;
  loadingMessage = '';
  errorMessage = '';
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  currentUser = this.authService.currentUserValue;

  // IA processing state
  iaProcessing = false;
  iaResult: 'done' | null = null;
  iaMatches: MatchBackend[] = [];
  iaStep = 0;
  iaStepMessage = '';
  private savedRelatoId = '';

  constructor(
    private fb: FormBuilder,
    private caoService: CaoService,
    private authService: AuthService,
    private cloudinary: CloudinaryService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      raca: ['', Validators.required],
      idade: [''],
      sexo: [''],
      cor: [''],
      porte: [''],
      descricao: [''],
      endereco: ['', Validators.required],
      bairro: [''],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
      contatoNome: [this.currentUser?.nome || '', Validators.required],
      contatoTelefone: [this.currentUser?.telefone || '', Validators.required],
      contatoEmail: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      observacoes: [''],
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = Array.from(input.files);
    newFiles.forEach(file => {
      this.selectedFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => this.previewUrls.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  private async geocodificarEndereco(bairro: string, cidade: string, estado: string): Promise<{ lat?: number; lng?: number }> {
    const address = [bairro, cidade, estado].filter(Boolean).join(', ') + ', Brasil';
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.warn('Geocodificação falhou, prosseguindo sem coordenadas.');
    }
    return {};
  }

  onSubmit(): void {
    if (this.cadastroForm.invalid || this.selectedFiles.length === 0) return;

    this.loading = true;
    this.iaProcessing = true;
    this.iaResult = null;
    this.iaMatches = [];
    this.iaStep = 1;
    this.iaStepMessage = 'Obtendo localização...';
    this.errorMessage = '';

    const f = this.cadastroForm.value;

    this.geocodificarEndereco(f.bairro, f.cidade, f.estado).then(coords => {
      this.iaStepMessage = 'Enviando fotos para a nuvem...';

      this.cloudinary.uploadImages(this.selectedFiles).subscribe({
      next: (urls) => {
        this.iaStep = 2;
        this.iaStepMessage = 'Cadastrando relato e buscando matches...';

        this.caoService.cadastrarCao({
          nome: f.nome,
          raca: f.raca,
          idade: f.idade || undefined,
          sexo: f.sexo || undefined,
          cor: f.cor || undefined,
          porte: f.porte || undefined,
          descricao: f.descricao || undefined,
          fotos: urls,
          dataPerdido: new Date(),
          localizacao: {
            endereco: f.endereco,
            bairro: f.bairro || undefined,
            cidade: f.cidade,
            estado: f.estado,
            latitude: coords.lat,
            longitude: coords.lng
          },
          contatoResponsavel: {
            nome: f.contatoNome,
            telefone: f.contatoTelefone,
            email: f.contatoEmail
          },
          observacoes: f.observacoes || undefined,
        }).subscribe({
          next: (cao) => {
            this.savedRelatoId = cao.id;
            this.iaStep = 3;
            this.iaStepMessage = 'A IA esta comparando imagens...';

            // Busca matches do relato recem-criado
            this.caoService.getMatches(cao.id).subscribe({
              next: (matches) => {
                this.iaMatches = matches.filter(m => m.scoreSimilaridade >= 0.75);
                this.iaProcessing = false;
                this.iaResult = 'done';
                this.loading = false;

                // Notifica matches de alta probabilidade
                matches.filter(m => m.scoreSimilaridade >= 0.75).forEach(m => {
                  this.notificationService.showMatch({
                    relatoId: cao.id,
                    nomeCao: cao.nome,
                    score: m.scoreSimilaridade,
                    snapshotUrl: m.avistamento.snapshotUrl,
                    local: m.avistamento.cameraOrigem?.enderecoLogradouro || ''
                  });
                });
              },
              error: () => {
                // Match endpoint falhou mas cadastro deu certo
                this.iaMatches = [];
                this.iaProcessing = false;
                this.iaResult = 'done';
                this.loading = false;
              }
            });
          },
          error: (err) => {
            this.iaProcessing = false;
            this.iaResult = null;
            this.errorMessage = 'Erro ao cadastrar: ' + err.message;
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.iaProcessing = false;
        this.iaResult = null;
        this.errorMessage = err.message;
        this.loading = false;
      }
    });
    }); // fim geocodificarEndereco.then
  }

  goToMatches(): void {
    this.router.navigate(['/matches']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
