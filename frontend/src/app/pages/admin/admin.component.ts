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