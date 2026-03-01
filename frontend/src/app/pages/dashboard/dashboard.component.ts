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