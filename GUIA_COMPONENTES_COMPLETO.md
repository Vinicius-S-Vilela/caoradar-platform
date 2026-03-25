# 🐕 GUIA COMPLETO - COMPONENTES RESTANTES CÃO RADAR

Este documento contém TODOS os componentes TypeScript que faltam para completar a aplicação.
Copie cada código e crie no caminho indicado.

---

## 📁 1. DASHBOARD COMPONENT
**Caminho**: `src/app/pages/dashboard/dashboard.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { Cao } from '../../core/models/cao.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <div>
            <h1>Meus Cães</h1>
            <p>Gerencie os cães cadastrados</p>
          </div>
          <a routerLink="/cadastro-cao" class="btn btn-primary">+ Cadastrar Cão</a>
        </div>
        
        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Carregando...</p>
        </div>

        <div class="empty-state" *ngIf="!loading && meusCaes.length === 0">
          <h3>Nenhum cão cadastrado</h3>
          <p>Você ainda não cadastrou nenhum cão</p>
          <a routerLink="/cadastro-cao" class="btn btn-primary">Cadastrar Agora</a>
        </div>

        <div class="grid" *ngIf="!loading && meusCaes.length > 0">
          <div class="card" *ngFor="let cao of meusCaes">
            <div class="card-image">
              <img [src]="cao.foto" [alt]="cao.nome" onError="this.src='assets/images/dog-placeholder.jpg'">
              <span class="badge" [class.badge-perdido]="cao.status === 'Perdido'" [class.badge-encontrado]="cao.status === 'Encontrado'">
                {{cao.status}}
              </span>
            </div>
            <div class="card-body">
              <h3>{{cao.nome}}</h3>
              <p class="raca">{{cao.raca}}</p>
              <p class="local">{{cao.localizacaoPerdido.cidade}}</p>
              <button class="btn btn-sm btn-outline" (click)="deleteCao(cao.id)">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-family: var(--font-display); font-size: 2.5rem; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm); transition: transform 0.2s; }
    .card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }
    .card-image { height: 200px; position: relative; overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .card-image .badge { position: absolute; top: 1rem; right: 1rem; }
    .card-body { padding: 1.5rem; }
    .card-body h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .raca { color: var(--primary-blue); font-weight: 600; margin: 0.5rem 0; }
    .local { color: var(--gray-text); font-size: 0.9rem; margin: 0.5rem 0 1rem; }
    .loading-state, .empty-state { text-align: center; padding: 4rem 2rem; }
    @media (max-width: 768px) { .page-header { flex-direction: column; gap: 1rem; } }
  `]
})
export class DashboardComponent implements OnInit {
  meusCaes: Cao[] = [];
  loading = true;

  constructor(private caoService: CaoService) {}

  ngOnInit(): void {
    this.caoService.getMeusCaes().subscribe({
      next: (caes) => { this.meusCaes = caes; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  deleteCao(id: string): void {
    if (confirm('Excluir este cadastro?')) {
      this.caoService.deleteCao(id).subscribe(() => {
        this.meusCaes = this.meusCaes.filter(c => c.id !== id);
      });
    }
  }
}
```

---

## 📁 2. CADASTRO CÃO COMPONENT
**Caminho**: `src/app/pages/cadastro-cao/cadastro-cao.component.ts`

```typescript
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

            <div class="form-group">
              <label class="form-label">Recompensa (R$)</label>
              <input type="number" class="form-control" formControlName="recompensa" 
                placeholder="0.00" step="0.01">
            </div>

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
```

---

## 📁 3. CÃES PERDIDOS COMPONENT
**Caminho**: `src/app/pages/caes-perdidos/caes-perdidos.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { Cao, RACAS_DISPONIVEIS } from '../../core/models/cao.model';

@Component({
  selector: 'app-caes-perdidos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <h1>Cães Perdidos</h1>
          <p>Ajude a encontrar estes amigos de quatro patas</p>
        </div>

        <div class="filters">
          <select [(ngModel)]="filtroRaca" (change)="aplicarFiltro()" class="form-control">
            <option value="">Todas as raças</option>
            <option *ngFor="let raca of racas" [value]="raca">{{raca}}</option>
          </select>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Carregando...</p>
        </div>

        <div class="grid" *ngIf="!loading">
          <div class="card" *ngFor="let cao of caesFiltrados">
            <div class="card-image">
              <img [src]="cao.foto" [alt]="cao.nome" onError="this.src='assets/images/dog-placeholder.jpg'">
              <span class="badge badge-perdido">Perdido</span>
            </div>
            <div class="card-body">
              <h3>{{cao.nome}}</h3>
              <p class="raca">{{cao.raca}}</p>
              <p class="info"><strong>Local:</strong> {{cao.localizacaoPerdido.bairro}}, {{cao.localizacaoPerdido.cidade}}</p>
              <p class="info"><strong>Data:</strong> {{cao.dataPerdido | date:'dd/MM/yyyy'}}</p>
              <p class="info" *ngIf="cao.recompensa"><strong>Recompensa:</strong> R$ {{cao.recompensa}}</p>
              <div class="contact">
                <p><strong>Contato:</strong></p>
                <p>{{cao.contatoResponsavel.nome}}</p>
                <p>{{cao.contatoResponsavel.telefone}}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && caesFiltrados.length === 0">
          <p>Nenhum cão perdido encontrado</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2.5rem; }
    .filters { display: flex; justify-content: center; margin-bottom: 2rem; }
    .filters select { max-width: 300px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm); }
    .card-image { height: 250px; position: relative; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; top: 1rem; right: 1rem; }
    .card-body { padding: 1.5rem; }
    .card-body h3 { margin: 0 0 0.5rem; }
    .raca { color: var(--primary-blue); font-weight: 600; margin: 0.5rem 0; }
    .info { margin: 0.5rem 0; font-size: 0.9rem; color: var(--gray-text); }
    .contact { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-light); }
    .contact p { margin: 0.25rem 0; font-size: 0.9rem; }
  `]
})
export class CaesPerdidosComponent implements OnInit {
  caesPerdidos: Cao[] = [];
  caesFiltrados: Cao[] = [];
  racas = RACAS_DISPONIVEIS;
  filtroRaca = '';
  loading = true;

  constructor(private caoService: CaoService) {}

  ngOnInit(): void {
    this.caoService.getCaesPerdidos().subscribe({
      next: (caes) => {
        this.caesPerdidos = caes;
        this.caesFiltrados = caes;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  aplicarFiltro(): void {
    if (this.filtroRaca) {
      this.caesFiltrados = this.caesPerdidos.filter(c => c.raca === this.filtroRaca);
    } else {
      this.caesFiltrados = this.caesPerdidos;
    }
  }
}
```

---

## 📁 4. CÃES ENCONTRADOS COMPONENT
**Caminho**: `src/app/pages/caes-encontrados/caes-encontrados.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { Cao, RACAS_DISPONIVEIS } from '../../core/models/cao.model';

@Component({
  selector: 'app-caes-encontrados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header success">
          <h1>🎉 Cães Encontrados</h1>
          <p>Estes pets já foram reencontrados com suas famílias!</p>
        </div>

        <div class="filters">
          <select [(ngModel)]="filtroRaca" (change)="aplicarFiltro()" class="form-control">
            <option value="">Todas as raças</option>
            <option *ngFor="let raca of racas" [value]="raca">{{raca}}</option>
          </select>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Carregando...</p>
        </div>

        <div class="grid" *ngIf="!loading">
          <div class="card success-card" *ngFor="let cao of caesFiltrados">
            <div class="card-image">
              <img [src]="cao.foto" [alt]="cao.nome" onError="this.src='assets/images/dog-placeholder.jpg'">
              <span class="badge badge-encontrado">✓ Encontrado</span>
            </div>
            <div class="card-body">
              <h3>{{cao.nome}}</h3>
              <p class="raca">{{cao.raca}}</p>
              <p class="info"><strong>Perdido em:</strong> {{cao.localizacaoPerdido.cidade}}</p>
              <p class="info"><strong>Encontrado em:</strong> {{cao.localizacaoEncontrado?.cidade}}</p>
              <p class="info success-text">
                <strong>Data do reencontro:</strong> {{cao.dataEncontrado | date:'dd/MM/yyyy'}}
              </p>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="!loading && caesFiltrados.length === 0">
          <p>Nenhum cão encontrado ainda</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2.5rem; color: var(--success-green); }
    .filters { display: flex; justify-content: center; margin-bottom: 2rem; }
    .filters select { max-width: 300px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: var(--shadow-sm); }
    .success-card { border: 2px solid var(--success-green); }
    .card-image { height: 250px; position: relative; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; }
    .badge { position: absolute; top: 1rem; right: 1rem; }
    .card-body { padding: 1.5rem; }
    .card-body h3 { margin: 0 0 0.5rem; }
    .raca { color: var(--primary-blue); font-weight: 600; margin: 0.5rem 0; }
    .info { margin: 0.5rem 0; font-size: 0.9rem; color: var(--gray-text); }
    .success-text { color: var(--success-green); font-weight: 600; }
  `]
})
export class CaesEncontradosComponent implements OnInit {
  caesEncontrados: Cao[] = [];
  caesFiltrados: Cao[] = [];
  racas = RACAS_DISPONIVEIS;
  filtroRaca = '';
  loading = true;

  constructor(private caoService: CaoService) {}

  ngOnInit(): void {
    this.caoService.getCaesEncontrados().subscribe({
      next: (caes) => {
        this.caesEncontrados = caes;
        this.caesFiltrados = caes;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  aplicarFiltro(): void {
    if (this.filtroRaca) {
      this.caesFiltrados = this.caesEncontrados.filter(c => c.raca === this.filtroRaca);
    } else {
      this.caesFiltrados = this.caesEncontrados;
    }
  }
}
```

---

## 📁 5. ADMIN COMPONENT
**Caminho**: `src/app/pages/admin/admin.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { CaoService } from '../../core/services/cao.service';
import { User } from '../../core/models/user.model';
import { Cao } from '../../core/models/cao.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <h1>🔧 Painel Administrativo</h1>
          <p>Gerenciamento de usuários e cães do sistema</p>
        </div>

        <!-- Estatísticas -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>{{stats.totalCaes}}</h3>
            <p>Total de Cães</p>
          </div>
          <div class="stat-card perdido">
            <h3>{{stats.caesPerdidos}}</h3>
            <p>Cães Perdidos</p>
          </div>
          <div class="stat-card encontrado">
            <h3>{{stats.caesEncontrados}}</h3>
            <p>Cães Encontrados</p>
          </div>
          <div class="stat-card">
            <h3>{{stats.taxaEncontro}}%</h3>
            <p>Taxa de Sucesso</p>
          </div>
        </div>

        <!-- Tabela de Usuários -->
        <div class="section">
          <h2>Usuários Cadastrados</h2>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>Admin</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of users">
                  <td>{{user.nome}}</td>
                  <td>{{user.email}}</td>
                  <td>{{user.telefone || '-'}}</td>
                  <td>{{user.isAdmin ? 'Sim' : 'Não'}}</td>
                  <td>
                    <button class="btn-sm btn-outline" (click)="deleteUser(user.id)">Excluir</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tabela de Cães -->
        <div class="section">
          <h2>Cães Cadastrados</h2>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Raça</th>
                  <th>Status</th>
                  <th>Cidade</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let cao of caes">
                  <td>{{cao.nome}}</td>
                  <td>{{cao.raca}}</td>
                  <td>
                    <span class="badge" [class.badge-perdido]="cao.status === 'Perdido'" 
                          [class.badge-encontrado]="cao.status === 'Encontrado'">
                      {{cao.status}}
                    </span>
                  </td>
                  <td>{{cao.localizacaoPerdido.cidade}}</td>
                  <td>{{cao.dataPerdido | date:'dd/MM/yyyy'}}</td>
                  <td>
                    <button class="btn-sm btn-outline" (click)="deleteCao(cao.id)">Excluir</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card { background: white; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: var(--shadow-sm); }
    .stat-card h3 { font-size: 2.5rem; margin: 0 0 0.5rem; color: var(--primary-blue); }
    .stat-card.perdido h3 { color: var(--warning-yellow); }
    .stat-card.encontrado h3 { color: var(--success-green); }
    .stat-card p { margin: 0; color: var(--gray-text); }
    .section { margin-bottom: 3rem; }
    .section h2 { font-size: 1.5rem; margin-bottom: 1rem; }
    .table-responsive { overflow-x: auto; background: white; border-radius: 12px; box-shadow: var(--shadow-sm); }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid var(--gray-light); }
    .data-table th { background: var(--secondary-blue); font-weight: 600; color: var(--gray-dark); }
    .data-table tr:last-child td { border-bottom: none; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  caes: Cao[] = [];
  stats = { totalCaes: 0, caesPerdidos: 0, caesEncontrados: 0, taxaEncontro: 0 };

  constructor(
    private authService: AuthService,
    private caoService: CaoService
  ) {}

  ngOnInit(): void {
    this.authService.getAllUsers().subscribe(users => this.users = users);
    this.caoService.getAllCaes().subscribe(caes => this.caes = caes);
    this.caoService.getEstatisticas().subscribe(stats => this.stats = stats);
  }

  deleteUser(id: string): void {
    if (confirm('Excluir este usuário?')) {
      this.authService.deleteUser(id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== id);
      });
    }
  }

  deleteCao(id: string): void {
    if (confirm('Excluir este cadastro?')) {
      this.caoService.deleteCao(id).subscribe(() => {
        this.caes = this.caes.filter(c => c.id !== id);
      });
    }
  }
}
```

---

## 🖼️ IMAGENS NECESSÁRIAS

Crie estes arquivos de imagem na pasta `src/assets/images/`:

1. **logo.png** - Use o logo enviado ou crie um simples
2. **dog-placeholder.jpg** - Imagem placeholder de cachorro (use qualquer imagem genérica)
3. **golden-retriever.jpg** - Foto de Golden Retriever
4. **yorkshire.jpg** - Foto de Yorkshire
5. **poodle.jpg** - Foto de Poodle
6. **bulldog-frances.jpg** - Foto de Bulldog Francês
7. **pastor-alemao.jpg** - Foto de Pastor Alemão

**Para testar sem imagens reais**: As imagens carregam com fallback para placeholder automático.

---

## ✅ CHECKLIST FINAL

- [ ] Todos os 5 componentes criados
- [ ] Arquivos no caminho correto
- [ ] Imagens colocadas em `assets/images/`
- [ ] `npm install` executado
- [ ] `ng serve` rodando sem erros
- [ ] Testar login com credenciais de teste
- [ ] Navegar por todas as páginas
- [ ] Testar cadastro de cão
- [ ] Verificar área admin

---

## 🚀 COMANDOS FINAIS

```bash
# Instalar dependências
npm install

# Rodar projeto
ng serve

# Build de produção
ng build --configuration production

# Deploy Vercel
vercel --prod
```

---

**✨ FIM DO GUIA - PROJETO COMPLETO!**
