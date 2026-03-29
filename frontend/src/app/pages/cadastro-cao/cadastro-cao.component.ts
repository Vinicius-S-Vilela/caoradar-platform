import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
import { CloudinaryService } from '../../core/services/cloudinary.service';
import { RACAS_DISPONIVEIS } from '../../core/models/cao.model';

@Component({
  selector: 'app-cadastro-cao',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container" style="max-width: 700px;">
        <div class="page-header">
          <h1>Cadastrar Cão Perdido</h1>
          <p>Preencha as informações do cão para iniciar a busca</p>
        </div>

        <div class="card" style="padding: 2rem;">
          <form [formGroup]="cadastroForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Nome do cão *</label>
              <input type="text" class="form-control" formControlName="nome" placeholder="Ex: Rex">
            </div>

            <div class="form-group">
              <label class="form-label">Raça *</label>
              <select class="form-control" formControlName="raca">
                <option value="">Selecione a raça</option>
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
                  <option value="Fêmea">Fêmea</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Cor</label>
              <input type="text" class="form-control" formControlName="cor" placeholder="Ex: Dourado">
            </div>

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-control" formControlName="descricao" rows="3"
                placeholder="Características, comportamento, etc."></textarea>
            </div>

            <!-- Upload de fotos -->
            <div class="form-group">
              <label class="form-label">Fotos do cão *</label>

              <div class="upload-area" (click)="fileInput.click()"
                   [class.has-files]="selectedFiles.length > 0">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Clique para selecionar imagens</p>
                <small>JPG, PNG ou WEBP — múltiplas imagens permitidas</small>
              </div>

              <input #fileInput type="file" accept="image/*" multiple hidden
                     (change)="onFilesSelected($event)">

              <!-- Previews -->
              <div class="previews" *ngIf="previewUrls.length > 0">
                <div class="preview-item" *ngFor="let url of previewUrls; let i = index">
                  <img [src]="url" alt="Preview">
                  <button type="button" class="remove-btn" (click)="removeFile(i)">×</button>
                </div>
              </div>

              <small *ngIf="selectedFiles.length === 0" style="color: var(--error-red);">
                Selecione ao menos uma foto
              </small>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Localização onde foi perdido</h3>

            <div class="form-group">
              <label class="form-label">Endereço *</label>
              <input type="text" class="form-control" formControlName="endereco" placeholder="Rua, número">
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

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Contato do Responsável</h3>

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
              <label class="form-label">Observações</label>
              <textarea class="form-control" formControlName="observacoes" rows="2"
                placeholder="Informações adicionais"></textarea>
            </div>

            <div *ngIf="errorMessage" class="error-banner">{{ errorMessage }}</div>

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline" routerLink="/dashboard" style="flex: 1;">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary"
                      [disabled]="cadastroForm.invalid || selectedFiles.length === 0 || loading"
                      style="flex: 1;">
                {{ loadingMessage || 'Cadastrar Cão' }}
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

    .previews {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .preview-item {
      position: relative;
      width: 90px;
      height: 90px;
    }
    .preview-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: var(--radius-sm, 6px);
      border: 1px solid var(--gray-border, #ccc);
    }
    .remove-btn {
      position: absolute;
      top: -6px;
      right: -6px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--error-red, #eb5757);
      color: white;
      border: none;
      cursor: pointer;
      font-size: 14px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-banner {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(235, 87, 87, 0.1);
      color: var(--error-red, #eb5757);
      border: 1px solid rgba(235, 87, 87, 0.3);
      border-radius: var(--radius-md, 8px);
      font-size: 0.9rem;
    }
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

  constructor(
    private fb: FormBuilder,
    private caoService: CaoService,
    private authService: AuthService,
    private cloudinary: CloudinaryService,
    private router: Router
  ) {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      raca: ['', Validators.required],
      idade: [''],
      sexo: [''],
      cor: [''],
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

    // Limpa o input para permitir re-selecionar o mesmo arquivo
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  onSubmit(): void {
    if (this.cadastroForm.invalid || this.selectedFiles.length === 0) return;

    this.loading = true;
    this.errorMessage = '';
    this.loadingMessage = 'Enviando fotos...';

    this.cloudinary.uploadImages(this.selectedFiles).subscribe({
      next: (urls) => {
        this.loadingMessage = 'Cadastrando...';
        const f = this.cadastroForm.value;

        this.caoService.cadastrarCao({
          nome: f.nome,
          raca: f.raca,
          idade: f.idade || undefined,
          sexo: f.sexo || undefined,
          cor: f.cor || undefined,
          descricao: f.descricao || undefined,
          fotos: urls,
          dataPerdido: new Date(),
          localizacao: {
            endereco: f.endereco,
            bairro: f.bairro || undefined,
            cidade: f.cidade,
            estado: f.estado
          },
          contatoResponsavel: {
            nome: f.contatoNome,
            telefone: f.contatoTelefone,
            email: f.contatoEmail
          },
          observacoes: f.observacoes || undefined,
        }).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: (err) => {
            this.errorMessage = 'Erro ao cadastrar: ' + err.message;
            this.loading = false;
            this.loadingMessage = '';
          }
        });
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.loading = false;
        this.loadingMessage = '';
      }
    });
  }
}
