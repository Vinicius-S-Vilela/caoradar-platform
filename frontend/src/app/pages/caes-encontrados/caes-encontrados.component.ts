import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
import { MatchBackend, Cao } from '../../core/models/cao.model';

@Component({
  selector: 'app-caes-encontrados',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <h1>Matches</h1>
          <p>Possiveis correspondencias entre caes perdidos e avistamentos</p>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Buscando matches...</p>
        </div>

        <div class="empty-state" *ngIf="!loading && allMatches.length === 0 && !errorMessage">
          <div class="empty-icon">&#128269;</div>
          <h3>Nenhum match encontrado</h3>
          <p>Quando a IA encontrar possiveis correspondencias, elas aparecerao aqui</p>
          <a routerLink="/caes-perdidos" class="btn btn-outline" style="margin-top: 1rem;">Ver caes perdidos</a>
        </div>

        <div class="error-state" *ngIf="!loading && errorMessage">
          <p>{{ errorMessage }}</p>
          <button class="btn btn-outline" (click)="loadData()">Tentar novamente</button>
        </div>

        <!-- MATCHES AGRUPADOS POR RELATO -->
        <div class="matches-list" *ngIf="!loading && allMatches.length > 0">
          <div class="match-group" *ngFor="let group of matchGroups">
            <div class="match-group-header">
              <img [src]="group.cao.foto || 'assets/images/dog-placeholder.jpg'" alt="Cao" class="group-photo"
                   onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
              <div class="group-info">
                <h3>{{ group.cao.nome }}</h3>
                <span class="badge badge-perdido">Perdido</span>
                <p>{{ group.cao.raca }} | {{ group.cao.cor || 'Cor nao informada' }}</p>
              </div>
              <span class="match-count">{{ group.matches.length }} match(es)</span>
              <button class="btn-encontrado" (click)="marcarEncontrado(group.cao)">
                Marcar como encontrado
              </button>
            </div>

            <div class="match-items">
              <div class="match-item high-score" *ngFor="let match of group.matches">
                <img [src]="match.avistamento.snapshotUrl || 'assets/images/dog-placeholder.jpg'" alt="Avistamento" class="match-snapshot"
                     onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
                <div class="match-details">
                  <div class="match-top">
                    <span class="score-badge high">
                      {{ (match.scoreSimilaridade * 100).toFixed(0) }}% similar
                    </span>
                    <span class="match-status" [ngClass]="'status-' + match.status">
                      {{ statusLabel(match.status) }}
                    </span>
                  </div>
                  <p class="match-location" *ngIf="match.avistamento.cameraOrigem?.enderecoLogradouro">
                    {{ match.avistamento.cameraOrigem?.enderecoLogradouro }}
                  </p>
                  <p class="match-features" *ngIf="match.avistamento.features">
                    Raca IA: {{ match.avistamento.features.racaEstimada || '?' }} |
                    Cor: {{ match.avistamento.features.corPredominante || '?' }} |
                    Porte: {{ match.avistamento.features.porteEstimado || '?' }}
                  </p>
                  <p class="match-explain" *ngIf="match.explicacaoLLM">
                    {{ match.explicacaoLLM }}
                  </p>
                  <p class="match-date">
                    Detectado: {{ match.avistamento.dataHora | date:'dd/MM/yyyy HH:mm' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2.5rem; color: var(--primary-blue); }
    .loading-state, .empty-state, .error-state { text-align: center; padding: 4rem 2rem; }
    .error-state p { color: var(--error-red); margin-bottom: 1rem; }

    .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.5; }
    .empty-state h3 { color: var(--gray-dark); margin-bottom: 0.5rem; }
    .empty-state p { color: var(--gray-text); }

    .matches-list { display: flex; flex-direction: column; gap: 2rem; }

    .match-group {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: var(--shadow-sm); border: 1px solid #e8ecf0;
    }
    .match-group-header {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #eef2f7);
      border-bottom: 1px solid #e8ecf0;
    }
    .group-photo {
      width: 50px; height: 50px; border-radius: 12px; object-fit: cover;
      border: 2px solid var(--primary-blue);
    }
    .group-info { flex: 1; }
    .group-info h3 { margin: 0; font-size: 1.1rem; color: var(--gray-dark); }
    .group-info p { margin: 0.25rem 0 0; font-size: 0.85rem; color: var(--gray-text); }
    .group-info .badge { font-size: 0.75rem; vertical-align: middle; margin-left: 0.5rem; }
    .match-count {
      background: var(--primary-blue); color: white; padding: 0.35rem 0.75rem;
      border-radius: 20px; font-size: 0.8rem; font-weight: 600; white-space: nowrap;
    }

    .match-items { padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

    .match-item {
      display: flex; gap: 1rem; padding: 1rem;
      border-radius: 12px; border: 2px solid #e8ecf0;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .match-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .match-item.high-score { border-color: #27ae60; background: #f0fff4; }

    .match-snapshot {
      width: 90px; height: 90px; border-radius: 10px; object-fit: cover; flex-shrink: 0;
    }
    .match-details { flex: 1; min-width: 0; }
    .match-top { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }

    .score-badge {
      padding: 0.25rem 0.75rem; border-radius: 20px;
      font-size: 0.8rem; font-weight: 700;
    }
    .score-badge.high { background: #d4edda; color: #155724; }

    .match-status {
      padding: 0.2rem 0.5rem; border-radius: 6px;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
    }
    .status-PENDENTE_ANALISE { background: #e3f2fd; color: #1565c0; }
    .status-CONFIRMADO_PELO_USUARIO { background: #e8f5e9; color: #2e7d32; }
    .status-REJEITADO_PELO_USUARIO { background: #fce4ec; color: #c62828; }

    .match-location { margin: 0; font-size: 0.85rem; color: var(--gray-text); }
    .match-features { margin: 0.25rem 0 0; font-size: 0.8rem; color: #777; }
    .match-explain { margin: 0.5rem 0 0; font-size: 0.8rem; color: #555; font-style: italic; line-height: 1.4; }
    .match-date { margin: 0.25rem 0 0; font-size: 0.75rem; color: #999; }

    .btn-encontrado {
      padding: 0.35rem 0.75rem; font-size: 0.75rem;
      background: #27ae60; color: white; border: none; border-radius: 8px;
      cursor: pointer; font-weight: 600; transition: background 0.2s;
      white-space: nowrap;
    }
    .btn-encontrado:hover { background: #219a52; }

    @media (max-width: 600px) {
      .match-item { flex-direction: column; }
      .match-snapshot { width: 100%; height: 150px; }
    }
  `]
})
export class CaesEncontradosComponent implements OnInit {
  allMatches: MatchBackend[] = [];
  matchGroups: { cao: Cao; matches: MatchBackend[] }[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private caoService: CaoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    // Busca os caes do usuario logado e seus matches
    this.caoService.getMeusCaes().subscribe({
      next: (caes) => {
        if (caes.length === 0) {
          this.allMatches = [];
          this.matchGroups = [];
          this.loading = false;
          return;
        }

        // Apenas caes com status Perdido podem ter matches ativos
        const caesPerdidos = caes.filter(c => c.status === 'Perdido');
        if (caesPerdidos.length === 0) {
          this.allMatches = [];
          this.matchGroups = [];
          this.loading = false;
          return;
        }

        let loaded = 0;
        const groups: { cao: Cao; matches: MatchBackend[] }[] = [];

        caesPerdidos.forEach(cao => {
          this.caoService.getMatches(cao.id).subscribe({
            next: (matches) => {
              const filtered = matches.filter(m => m.scoreSimilaridade >= 0.75);
              if (filtered.length > 0) {
                groups.push({ cao, matches: filtered.sort((a, b) => b.scoreSimilaridade - a.scoreSimilaridade) });
                this.allMatches.push(...filtered);
              }
              loaded++;
              if (loaded === caesPerdidos.length) {
                this.matchGroups = groups.sort((a, b) =>
                  Math.max(...b.matches.map(m => m.scoreSimilaridade)) -
                  Math.max(...a.matches.map(m => m.scoreSimilaridade))
                );
                this.loading = false;
              }
            },
            error: () => {
              loaded++;
              if (loaded === caesPerdidos.length) {
                this.matchGroups = groups;
                this.loading = false;
              }
            }
          });
        });
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erro ao carregar matches';
        this.loading = false;
      }
    });
  }

  marcarEncontrado(cao: Cao): void {
    if (!confirm(`Marcar ${cao.nome} como encontrado?`)) return;

    this.caoService.marcarComoEncontrado(cao.id).subscribe({
      next: () => {
        this.allMatches = [];
        this.matchGroups = [];
        this.loadData();
      },
      error: (err) => {
        alert('Erro ao atualizar status: ' + err.message);
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      'PENDENTE_ANALISE': 'Pendente',
      'CONFIRMADO_PELO_USUARIO': 'Confirmado',
      'REJEITADO_PELO_USUARIO': 'Rejeitado'
    };
    return map[status] || status;
  }
}
