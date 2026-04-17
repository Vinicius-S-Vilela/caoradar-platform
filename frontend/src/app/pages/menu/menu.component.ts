import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { MapComponent, MapMarker } from '../../shared/components/map.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
import { Cao, MatchBackend, dedupMatches } from '../../core/models/cao.model';

interface Notificacao {
  tipo: 'match' | 'info';
  mensagem: string;
  data: Date;
  snapshotUrl?: string;
  score?: number;
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, MapComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="page-content">
      <div class="container">
        <div class="page-header">
          <h1>Menu</h1>
          <p>Visao geral da sua conta</p>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner"></div>
          <p>Carregando...</p>
        </div>

        <ng-container *ngIf="!loading">
          <!-- STATUS DOS CAES (carrossel horizontal) -->
          <section class="section">
            <div class="section-title-row">
              <h2>Status</h2>
              <a routerLink="/dashboard" class="see-more">Ver todos &rarr;</a>
            </div>
            <div class="status-scroll" *ngIf="meusCaes.length > 0">
              <div class="status-card" *ngFor="let cao of meusCaes" [routerLink]="'/dashboard'">
                <img [src]="cao.foto" alt="Cao" class="status-photo"
                     onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
                <div class="status-info">
                  <span class="badge" [class.badge-perdido]="cao.status === 'Perdido'" [class.badge-encontrado]="cao.status === 'Encontrado'">
                    {{ cao.status }}
                  </span>
                  <p><strong>Raca:</strong> {{ cao.raca }}</p>
                  <p><strong>Cor:</strong> {{ cao.cor || 'N/I' }}</p>
                </div>
              </div>
            </div>
            <div class="empty-inline" *ngIf="meusCaes.length === 0">
              <p>Nenhum cao cadastrado. <a routerLink="/cadastro-cao">Cadastrar agora</a></p>
            </div>
          </section>

          <!-- LAYOUT 2 COLUNAS -->
          <div class="two-col">
            <!-- NOTIFICACOES -->
            <section class="section notifications-section">
              <div class="section-title-row">
                <h2>Notificacoes</h2>
                <a routerLink="/matches" class="see-more">Ver matches &rarr;</a>
              </div>
              <div class="notifications-list" *ngIf="notificacoes.length > 0">
                <div class="notif-card" *ngFor="let n of notificacoes" [class.notif-match]="n.tipo === 'match'">
                  <div class="notif-body">
                    <p>{{ n.mensagem }}</p>
                    <span class="notif-date">{{ n.data | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>
              <div class="empty-inline" *ngIf="notificacoes.length === 0">
                <p>Nenhuma notificacao no momento</p>
              </div>
            </section>

            <!-- MAPA -->
            <section class="section map-section">
              <div class="section-title-row">
                <h2>Mapa de avistamentos</h2>
              </div>
              <app-map
                *ngIf="mapMarkers.length > 0"
                [markers]="mapMarkers"
                [centerLat]="mapCenterLat"
                [centerLng]="mapCenterLng"
                [showRadius]="true"
                [radiusMeters]="2000"
                (markerDismissed)="onMarkerDismissed($event)"
                height="400px"
              ></app-map>
              <div class="empty-inline" *ngIf="mapMarkers.length === 0">
                <p>Cadastre um cao com localizacao para ver o mapa</p>
              </div>
            </section>
          </div>

          <!-- STATS RAPIDOS -->
          <section class="section stats-section">
            <div class="stat-card">
              <span class="stat-number">{{ meusCaes.length }}</span>
              <span class="stat-label">Meus caes</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ totalMatches }}</span>
              <span class="stat-label">Matches</span>
            </div>
          </section>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .page-content { min-height: 100vh; padding: 100px 0 3rem; background: var(--secondary-blue); }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2.5rem; color: var(--primary-blue); margin: 0; }
    .page-header p { color: var(--gray-text); }
    .loading-state { text-align: center; padding: 4rem 2rem; }

    .section { margin-bottom: 2rem; }
    .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-title-row h2 { margin: 0; font-size: 1.3rem; color: var(--gray-dark); }
    .see-more { font-size: 0.85rem; color: var(--primary-blue); text-decoration: none; font-weight: 600; }
    .see-more:hover { text-decoration: underline; }

    /* STATUS SCROLL */
    .status-scroll {
      display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 0.5rem;
      scrollbar-width: thin;
    }
    .status-card {
      display: flex; align-items: center; gap: 0.75rem;
      min-width: 260px; background: white; border-radius: 14px;
      padding: 0.75rem 1rem; border: 2px solid #e8ecf0;
      cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
      flex-shrink: 0;
    }
    .status-card:hover { border-color: var(--primary-blue); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .status-photo {
      width: 55px; height: 55px; border-radius: 50%; object-fit: cover;
      border: 2px solid #e0e0e0;
    }
    .status-info p { margin: 0.15rem 0; font-size: 0.8rem; color: var(--gray-text); }
    /* badges usam classes globais badge-perdido / badge-encontrado */

    /* 2 COLUNAS */
    .two-col { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }

    /* NOTIFICACOES */
    .notifications-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 420px; overflow-y: auto; }
    .notif-card {
      background: white; border-radius: 10px; padding: 0.75rem 1rem;
      border: 1px solid #e8ecf0; transition: background 0.2s;
    }
    .notif-card.notif-match { border-left: 3px solid var(--primary-blue); background: #f0f7ff; }
    .notif-body p { margin: 0 0 0.25rem; font-size: 0.85rem; color: var(--gray-dark); line-height: 1.4; }
    .notif-date { font-size: 0.75rem; color: #999; }

    /* STATS */
    .stats-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .stat-card {
      background: white; border-radius: 14px; padding: 1.25rem;
      text-align: center; box-shadow: var(--shadow-sm);
      border: 2px solid #e8ecf0;
    }
    .stat-number { display: block; font-size: 2rem; font-weight: 700; color: var(--primary-blue); }
    .stat-label { font-size: 0.85rem; color: var(--gray-text); }

    .empty-inline { text-align: center; padding: 2rem; color: var(--gray-text); font-size: 0.9rem; }
    .empty-inline a { color: var(--primary-blue); font-weight: 600; }

    @media (max-width: 600px) {
      .stats-section { grid-template-columns: 1fr; }
    }
  `]
})
export class MenuComponent implements OnInit {
  meusCaes: Cao[] = [];
  allMatches: MatchBackend[] = [];
  notificacoes: Notificacao[] = [];
  mapMarkers: MapMarker[] = [];
  mapCenterLat = -23.55;
  mapCenterLng = -46.63;
  totalMatches = 0;
  loading = true;

  constructor(
    private caoService: CaoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.caoService.getMeusCaes().subscribe({
      next: (caes) => {
        this.meusCaes = caes;
        this.buildMapMarkers();

        if (caes.length === 0) {
          this.loading = false;
          return;
        }

        // So buscar matches para caes perdidos
        const caesPerdidos = caes.filter(c => c.status === 'Perdido');
        if (caesPerdidos.length === 0) {
          this.loading = false;
          return;
        }

        let loaded = 0;
        caesPerdidos.forEach(cao => {
          this.caoService.getMatches(cao.id).subscribe({
            next: (matches) => {
              const goodMatches = dedupMatches(matches).filter(m => m.scoreSimilaridade >= 0.75);
              this.allMatches.push(...goodMatches);
              goodMatches.forEach(m => {
                this.notificacoes.push({
                  tipo: 'match',
                  mensagem: `Match para ${cao.nome}: ${(m.scoreSimilaridade * 100).toFixed(0)}% similar - ${m.avistamento.cameraOrigem?.enderecoLogradouro || 'Local nao informado'}`,
                  data: new Date(m.createdAt),
                  snapshotUrl: m.avistamento.snapshotUrl,
                  score: m.scoreSimilaridade
                });

                // Marca avistamento no mapa com linha tracejada até o cão perdido
                if (m.avistamento.cameraOrigem?.latitude && m.avistamento.cameraOrigem?.longitude) {
                  const latCao = cao.localizacaoPerdido.latitude;
                  const lngCao = cao.localizacaoPerdido.longitude;
                  this.mapMarkers = [...this.mapMarkers, {
                    lat: m.avistamento.cameraOrigem.latitude,
                    lng: m.avistamento.cameraOrigem.longitude,
                    label: `${cao.nome} — ${(m.scoreSimilaridade * 100).toFixed(0)}% similar`,
                    type: 'avistamento',
                    imageUrl: m.avistamento.snapshotUrl,
                    conectarCom: latCao && lngCao ? { lat: latCao, lng: lngCao } : undefined
                  }];
                }
              });

              loaded++;
              if (loaded === caesPerdidos.length) this.finalize();
            },
            error: () => {
              loaded++;
              if (loaded === caesPerdidos.length) this.finalize();
            }
          });
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private finalize(): void {
    this.allMatches = this.allMatches.filter(m => m.scoreSimilaridade >= 0.75);
    this.totalMatches = this.allMatches.length;

    // Se nao tem matches, adiciona info
    if (this.allMatches.length === 0 && this.meusCaes.length > 0) {
      this.meusCaes.forEach(cao => {
        this.notificacoes.push({
          tipo: 'info',
          mensagem: `Busca por ${cao.nome} em andamento. Iremos atualizar quando encontrarmos algo semelhante.`,
          data: new Date()
        });
      });
    }

    this.notificacoes.sort((a, b) => b.data.getTime() - a.data.getTime());
    this.loading = false;
  }

  private buildMapMarkers(): void {
    const dismissed = this.getDismissedIds();
    this.meusCaes.forEach(cao => {
      if (dismissed.has(cao.id)) return;
      const lat = cao.localizacaoPerdido.latitude;
      const lng = cao.localizacaoPerdido.longitude;
      if (lat && lng) {
        const encontrado = cao.status === 'Encontrado';
        this.mapMarkers.push({
          id: cao.id,
          lat, lng,
          label: `${cao.nome} - ${cao.status}`,
          imageUrl: cao.foto,
          type: encontrado ? 'encontrado' : 'perdido',
          dismissible: encontrado
        });
        if (this.mapMarkers.length === 1) {
          this.mapCenterLat = lat;
          this.mapCenterLng = lng;
        }
      }
    });
  }

  onMarkerDismissed(id: string): void {
    const ids = this.getDismissedIds();
    ids.add(id);
    localStorage.setItem('caoradar:dismissedMapIds', JSON.stringify([...ids]));
    this.mapMarkers = this.mapMarkers.filter(m => m.id !== id);
  }

  private getDismissedIds(): Set<string> {
    try {
      const raw = localStorage.getItem('caoradar:dismissedMapIds');
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  }
}
