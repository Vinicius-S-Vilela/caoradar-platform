import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { AdminCamerasComponent } from './admin-cameras.component';
import { AuthService } from '../../core/services/auth.service';
import { CaoService } from '../../core/services/cao.service';
import { User } from '../../core/models/user.model';
import { Cao } from '../../core/models/cao.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, AdminCamerasComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <h1>🔧 Painel Administrativo</h1>
          <p>Gerenciamento completo do sistema Cão Radar</p>
        </div>

        <!-- Abas de navegação -->
        <div class="tabs">
          <button 
            class="tab" 
            [class.active]="activeTab === 'overview'"
            (click)="activeTab = 'overview'"
          >
            📊 Visão Geral
          </button>
          <button 
            class="tab" 
            [class.active]="activeTab === 'users'"
            (click)="activeTab = 'users'"
          >
            👥 Usuários
          </button>
          <button 
            class="tab" 
            [class.active]="activeTab === 'dogs'"
            (click)="activeTab = 'dogs'"
          >
            🐕 Cães
          </button>
          <button 
            class="tab" 
            [class.active]="activeTab === 'cameras'"
            (click)="activeTab = 'cameras'"
          >
            🎥 Câmeras
          </button>
        </div>

        <!-- Conteúdo das abas -->
        <div class="tab-content">
          <!-- Visão Geral -->
          <div *ngIf="activeTab === 'overview'">
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
          </div>

          <!-- Usuários -->
          <div *ngIf="activeTab === 'users'">
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
                      <td>
                        <span class="badge" [class.badge-encontrado]="user.role === 'ADMIN'">
                          {{user.role === 'ADMIN' ? 'Sim' : 'Não'}}
                        </span>
                      </td>
                      <td>
                        <button class="btn-sm btn-outline" (click)="deleteUser(user.id)">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Cães -->
          <div *ngIf="activeTab === 'dogs'">
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
                        <span 
                          class="badge" 
                          [class.badge-perdido]="cao.status === 'Perdido'" 
                          [class.badge-encontrado]="cao.status === 'Encontrado'"
                        >
                          {{cao.status}}
                        </span>
                      </td>
                      <td>{{cao.localizacaoPerdido.cidade}}</td>
                      <td>{{cao.dataPerdido | date:'dd/MM/yyyy'}}</td>
                      <td>
                        <button class="btn-sm btn-outline" (click)="deleteCao(cao.id)">
                          Excluir
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Câmeras -->
          <div *ngIf="activeTab === 'cameras'">
            <app-admin-cameras></app-admin-cameras>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content {
      min-height: 100vh;
      padding: 100px 0 3rem;
      background: var(--secondary-blue);
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      background: white;
      padding: 0.5rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }

    .tab {
      flex: 1;
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 600;
      color: var(--gray-text);
      cursor: pointer;
      transition: all var(--transition-fast);
      white-space: nowrap;
    }

    .tab:hover {
      background: var(--secondary-blue);
      color: var(--primary-blue);
    }

    .tab.active {
      background: var(--primary-blue);
      color: white;
    }

    .tab-content {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .stat-card h3 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem;
      color: var(--primary-blue);
    }

    .stat-card.perdido h3 {
      color: var(--warning-yellow);
    }

    .stat-card.encontrado h3 {
      color: var(--success-green);
    }

    .stat-card p {
      margin: 0;
      color: var(--gray-text);
    }

    .section {
      margin-bottom: 3rem;
    }

    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }

    .table-responsive {
      overflow-x: auto;
      background: white;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th,
    .data-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid var(--gray-light);
    }

    .data-table th {
      background: var(--secondary-blue);
      font-weight: 600;
      color: var(--gray-dark);
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover {
      background: var(--secondary-blue);
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr 1fr;
      }

      .tabs {
        overflow-x: scroll;
      }

      .tab {
        flex: 0 0 auto;
      }
    }
  `]
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  caes: Cao[] = [];
  stats = { totalCaes: 0, caesPerdidos: 0, caesEncontrados: 0, taxaEncontro: 0 };
  activeTab: 'overview' | 'users' | 'dogs' | 'cameras' = 'overview';

  constructor(
    private authService: AuthService,
    private caoService: CaoService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
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
        this.loadData();
      });
    }
  }
}