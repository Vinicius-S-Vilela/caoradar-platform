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

        <div class="error-state" *ngIf="!loading && errorMessage">
          <p>{{errorMessage}}</p>
          <button class="btn btn-outline" (click)="retry()">Tentar novamente</button>
        </div>

        <div class="empty-state" *ngIf="!loading && !errorMessage && caesFiltrados.length === 0">
          <p>Nenhum cão perdido registrado no momento</p>
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
    .error-state { text-align: center; padding: 4rem 2rem; }
    .error-state p { color: var(--error-red); margin-bottom: 1rem; font-size: 1.1rem; }
    .loading-state { text-align: center; padding: 4rem 2rem; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--gray-text); font-size: 1.1rem; }
  `]
})
export class CaesPerdidosComponent implements OnInit {
  caesPerdidos: Cao[] = [];
  caesFiltrados: Cao[] = [];
  racas = RACAS_DISPONIVEIS;
  filtroRaca = '';
  loading = true;
  errorMessage = '';

  constructor(private caoService: CaoService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.caoService.getCaesPerdidos().subscribe({
      next: (caes) => {
        this.caesPerdidos = caes;
        this.caesFiltrados = caes;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erro ao carregar dados';
        this.loading = false;
      }
    });
  }

  retry(): void {
    this.loadData();
  }

  aplicarFiltro(): void {
    if (this.filtroRaca) {
      this.caesFiltrados = this.caesPerdidos.filter(c => c.raca === this.filtroRaca);
    } else {
      this.caesFiltrados = this.caesPerdidos;
    }
  }
}