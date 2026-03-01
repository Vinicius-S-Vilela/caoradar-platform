import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
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

            <div class="form-group">
              <label class="form-label">URL da Foto *</label>
              <input type="url" class="form-control" formControlName="foto" 
                placeholder="https://exemplo.com/foto.jpg">
              <small style="color: var(--gray-text); font-size: 0.85rem;">
                Cole o link de uma imagem do seu cão
              </small>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Localização onde foi perdido</h3>

            <div class="form-group">
              <label class="form-label">Endereço *</label>
              <input type="text" class="form-control" formControlName="endereco" 
                placeholder="Rua, número">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Bairro</label>
                <input type="text" class="form-control" formControlName="bairro" 
                  placeholder="Bairro">
              </div>
              <div class="form-group">
                <label class="form-label">Cidade *</label>
                <input type="text" class="form-control" formControlName="cidade" 
                  placeholder="Cidade">
              </div>
              <div class="form-group">
                <label class="form-label">Estado *</label>
                <input type="text" class="form-control" formControlName="estado" 
                  placeholder="UF" maxlength="2">
              </div>
            </div>

            <h3 style="margin: 2rem 0 1rem; font-size: 1.25rem;">Contato do Responsável</h3>

            <div class="form-group">
              <label class="form-label">Nome *</label>
              <input type="text" class="form-control" formControlName="contatoNome" 
                placeholder="Seu nome">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telefone *</label>
                <input type="tel" class="form-control" formControlName="contatoTelefone" 
                  placeholder="(00) 00000-0000">
              </div>
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input type="email" class="form-control" formControlName="contatoEmail" 
                  placeholder="email@exemplo.com">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Observações</label>
              <textarea class="form-control" formControlName="observacoes" rows="2" 
                placeholder="Informações adicionais"></textarea>
            </div>

            <!-- <div class="form-group">
              <label class="form-label">Recompensa (R$)</label>
              <input type="number" class="form-control" formControlName="recompensa" 
                placeholder="0.00" step="0.01">
            </div> -->

            <div style="display: flex; gap: 1rem; margin-top: 2rem;">
              <button type="button" class="btn btn-outline" routerLink="/dashboard" style="flex: 1;">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="cadastroForm.invalid || loading" style="flex: 1;">
                {{loading ? 'Cadastrando...' : 'Cadastrar Cão'}}
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
  `]
})
export class CadastroCaoComponent {
  cadastroForm: FormGroup;
  racas = RACAS_DISPONIVEIS;
  loading = false;
  currentUser = this.authService.currentUserValue;

  constructor(
    private fb: FormBuilder,
    private caoService: CaoService,
    private authService: AuthService,
    private router: Router
  ) {
    this.cadastroForm = this.fb.group({
      nome: ['', Validators.required],
      raca: ['', Validators.required],
      idade: [''],
      sexo: [''],
      cor: [''],
      descricao: [''],
      foto: ['', Validators.required],
      endereco: ['', Validators.required],
      bairro: [''],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],
      contatoNome: [this.currentUser?.nome || '', Validators.required],
      contatoTelefone: [this.currentUser?.telefone || '', Validators.required],
      contatoEmail: [this.currentUser?.email || '', [Validators.required, Validators.email]],
      observacoes: [''],
      recompensa: ['']
    });
  }

  onSubmit(): void {
    if (this.cadastroForm.invalid) return;

    this.loading = true;
    const formData = this.cadastroForm.value;

    const caoCadastro = {
      nome: formData.nome,
      raca: formData.raca,
      idade: formData.idade || undefined,
      sexo: formData.sexo || undefined,
      cor: formData.cor || undefined,
      descricao: formData.descricao || undefined,
      foto: formData.foto,
      dataPerdido: new Date(),
      localizacao: {
        endereco: formData.endereco,
        bairro: formData.bairro || undefined,
        cidade: formData.cidade,
        estado: formData.estado
      },
      contatoResponsavel: {
        nome: formData.contatoNome,
        telefone: formData.contatoTelefone,
        email: formData.contatoEmail
      },
      observacoes: formData.observacoes || undefined,
      recompensa: formData.recompensa || undefined
    };

    this.caoService.cadastrarCao(caoCadastro).subscribe({
      next: () => {
        alert('Cão cadastrado com sucesso!');
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        alert('Erro ao cadastrar: ' + error.message);
        this.loading = false;
      }
    });
  }
}