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
          <h1>Cães Encontrados</h1>
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