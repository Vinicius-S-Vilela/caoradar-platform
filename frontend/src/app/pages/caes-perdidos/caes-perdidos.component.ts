import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { CaoService } from '../../core/services/cao.service';
import { AuthService } from '../../core/services/auth.service';
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
              <img [src]="cao.foto" [alt]="cao.nome" onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
              <span class="badge badge-perdido">Perdido</span>
            </div>
            <div class="card-body">
              <h3>{{cao.nome}}</h3>
              <p class="raca">{{cao.raca}}</p>
              <p class="info">
                <strong>Local:</strong>
                <span *ngIf="addresses[cao.id]; else resolving">{{ addresses[cao.id] }}</span>
                <ng-template #resolving>
                  <span class="resolving">...</span>
                </ng-template>
              </p>
              <p class="info"><strong>Data:</strong> {{cao.dataPerdido | date:'dd/MM/yyyy'}}</p>
              <p class="info" *ngIf="cao.recompensa"><strong>Recompensa:</strong> R$ {{cao.recompensa}}</p>
              <div class="contact">
                <p><strong>Contato:</strong></p>
                <p>{{cao.contatoResponsavel.nome}}</p>
                <p>{{cao.contatoResponsavel.telefone}}</p>
                <p *ngIf="cao.contatoResponsavel.email">{{cao.contatoResponsavel.email}}</p>
              </div>
              <p class="observacoes" *ngIf="cao.observacoes">
                <strong>Observações:</strong> {{cao.observacoes}}
              </p>
              <button *ngIf="isAdmin" class="btn-delete" (click)="deletarCao(cao)">
                Remover relato
              </button>
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
    .resolving { color: #bbb; font-style: italic; }
    .contact { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--gray-light); }
    .contact p { margin: 0.25rem 0; font-size: 0.9rem; }
    .observacoes { margin-top: 0.75rem; font-size: 0.85rem; color: var(--gray-text); line-height: 1.4; }
    .error-state { text-align: center; padding: 4rem 2rem; }
    .error-state p { color: var(--error-red); margin-bottom: 1rem; font-size: 1.1rem; }
    .loading-state { text-align: center; padding: 4rem 2rem; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--gray-text); font-size: 1.1rem; }
    .btn-delete { margin-top: 1rem; width: 100%; padding: 0.6rem; background: var(--error-red); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: opacity 0.2s; }
    .btn-delete:hover { opacity: 0.85; }
  `]
})
export class CaesPerdidosComponent implements OnInit {
  caesPerdidos: Cao[] = [];
  caesFiltrados: Cao[] = [];
  racas = RACAS_DISPONIVEIS;
  filtroRaca = '';
  loading = true;
  errorMessage = '';
  isAdmin = false;
  addresses: Record<string, string> = {};

  constructor(
    private caoService: CaoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadData();
  }

  deletarCao(cao: Cao): void {
    if (!confirm(`Remover o relato de ${cao.nome}?`)) return;
    this.caoService.deleteCao(cao.id).subscribe({
      next: () => {
        this.caesPerdidos = this.caesPerdidos.filter(c => c.id !== cao.id);
        this.aplicarFiltro();
      },
      error: (err) => alert(err.message || 'Erro ao remover relato')
    });
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.caoService.getCaesPerdidos().subscribe({
      next: (caes) => {
        this.caesPerdidos = caes;
        this.caesFiltrados = caes;
        this.loading = false;
        this.resolverEnderecos(caes);
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
    this.caesFiltrados = this.filtroRaca
      ? this.caesPerdidos.filter(c => c.raca === this.filtroRaca)
      : this.caesPerdidos;
  }

  private async resolverEnderecos(caes: Cao[]): Promise<void> {
    for (const cao of caes) {
      const lat = cao.localizacaoPerdido.latitude;
      const lng = cao.localizacaoPerdido.longitude;

      const textoCached = [cao.localizacaoPerdido.bairro, cao.localizacaoPerdido.cidade, cao.localizacaoPerdido.estado]
        .filter(Boolean).join(', ');

      if (textoCached) {
        this.addresses[cao.id] = textoCached;
        continue;
      }

      if (!lat || !lng) {
        this.addresses[cao.id] = 'Localização não informada';
        continue;
      }

      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'CaoRadar/1.0' } }
        );
        const data = await resp.json();
        this.addresses[cao.id] = this.formatarEndereco(data);
      } catch {
        this.addresses[cao.id] = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      // Respeita o limite de 1 req/s do Nominatim
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  private formatarEndereco(data: any): string {
    const a = data?.address;
    if (!a) return data?.display_name?.split(',').slice(0, 3).join(',').trim() || 'Endereço não encontrado';
    const partes = [
      a.road || a.pedestrian || a.path,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.municipality,
      a.state
    ].filter(Boolean);
    return partes.slice(0, 3).join(', ');
  }
}
