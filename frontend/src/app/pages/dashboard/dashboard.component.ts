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

        <div class="error-state" *ngIf="!loading && errorMessage">
          <p class="error-text">{{errorMessage}}</p>
          <button class="btn btn-outline" (click)="loadData()">Tentar novamente</button>
        </div>

        <div class="empty-state" *ngIf="!loading && !errorMessage && meusCaes.length === 0">
          <h3>Nenhum cão cadastrado</h3>
          <p>Você ainda não cadastrou nenhum cão</p>
          <a routerLink="/cadastro-cao" class="btn btn-primary">Cadastrar Agora</a>
        </div>

        <div class="grid" *ngIf="!loading && meusCaes.length > 0">
          <div class="card" *ngFor="let cao of meusCaes">
            <div class="card-image">
              <img [src]="cao.foto" [alt]="cao.nome" onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
              <span class="badge" [class.badge-perdido]="cao.status === 'Perdido'" [class.badge-encontrado]="cao.status === 'Encontrado'">
                {{cao.status}}
              </span>
              <button type="button" class="info-btn" (click)="openDetails(cao)" title="Ver detalhes">i</button>
            </div>
            <div class="card-body">
              <h3>{{cao.nome}}</h3>
              <p class="raca">{{cao.raca}}</p>
              <p class="local">{{ addresses[cao.id] || '...' }}</p>
              <div class="card-actions">
                <button *ngIf="cao.status === 'Perdido'" class="btn btn-sm btn-encontrado" (click)="marcarEncontrado(cao)">Encontrado</button>
                <button class="btn btn-sm btn-outline" (click)="deleteCao(cao.id)">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL DE DETALHES -->
      <div class="modal-overlay" *ngIf="selectedCao" (click)="closeDetails()">
        <div class="modal" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="closeDetails()">&times;</button>
          <img [src]="selectedCao.foto" [alt]="selectedCao.nome" class="modal-photo"
               onerror="this.onerror=null;this.src='assets/images/dog-placeholder.jpg'">
          <h2>{{ selectedCao.nome }}</h2>
          <span class="badge"
                [class.badge-perdido]="selectedCao.status === 'Perdido'"
                [class.badge-encontrado]="selectedCao.status === 'Encontrado'">
            {{ selectedCao.status }}
          </span>

          <dl class="details">
            <div><dt>Raça</dt><dd>{{ selectedCao.raca || '—' }}</dd></div>
            <div><dt>Cor</dt><dd>{{ selectedCao.cor || '—' }}</dd></div>
            <div><dt>Idade</dt><dd>{{ selectedCao.idade ? selectedCao.idade + ' ano(s)' : '—' }}</dd></div>
            <div><dt>Sexo</dt><dd>{{ selectedCao.sexo || '—' }}</dd></div>
            <div><dt>Local</dt><dd>{{ addresses[selectedCao.id] || localTexto(selectedCao) }}</dd></div>
            <div>
              <dt>Localização</dt>
              <dd>{{ selectedCao ? (addresses[selectedCao.id] || '...') : '' }}</dd>
            </div>
            <div><dt>Data de perda</dt><dd>{{ selectedCao.dataPerdido | date:'dd/MM/yyyy' }}</dd></div>
            <div *ngIf="selectedCao.descricao"><dt>Descrição</dt><dd>{{ selectedCao.descricao }}</dd></div>
            <div><dt>Contato</dt><dd>{{ selectedCao.contatoResponsavel.nome }} — {{ selectedCao.contatoResponsavel.telefone }}</dd></div>
          </dl>
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
    .info-btn {
      position: absolute; top: 1rem; left: 1rem;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.95); color: var(--primary-blue);
      border: none; cursor: pointer; font-weight: 700; font-style: italic;
      box-shadow: 0 2px 6px rgba(0,0,0,0.2); font-size: 1rem;
      transition: background 0.2s;
    }
    .info-btn:hover { background: var(--primary-blue); color: white; }
    .card-body { padding: 1.5rem; }
    .card-body h3 { margin: 0 0 0.5rem; font-size: 1.25rem; }
    .raca { color: var(--primary-blue); font-weight: 600; margin: 0.5rem 0; }
    .local { color: var(--gray-text); font-size: 0.9rem; margin: 0.5rem 0 1rem; }
    .card-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-encontrado { background: #27ae60 !important; color: white !important; border-color: #27ae60 !important; }
    .btn-encontrado:hover { background: #219a52 !important; }
    .loading-state, .empty-state, .error-state { text-align: center; padding: 4rem 2rem; }
    .error-text { color: var(--error-red); margin-bottom: 1rem; font-size: 1.1rem; }

    .modal-overlay {
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn .2s ease;
    }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    .modal {
      background: white; border-radius: 18px; padding: 2rem;
      max-width: 460px; width: 92%; max-height: 90vh; overflow-y: auto;
      position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
    }
    .modal-close {
      position: absolute; top: .5rem; right: .75rem;
      background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #888;
    }
    .modal-photo {
      width: 140px; height: 140px; border-radius: 50%;
      object-fit: cover; margin: 0 auto 1rem; display: block;
      border: 4px solid var(--primary-blue);
    }
    .modal h2 { margin: 0 0 .5rem; }
    .details {
      margin: 1.25rem 0 0; text-align: left;
      display: flex; flex-direction: column; gap: .6rem;
    }
    .details div {
      display: grid; grid-template-columns: 110px 1fr;
      gap: .5rem; padding: .4rem 0; border-bottom: 1px solid #f0f0f0;
    }
    .details div:last-child { border-bottom: none; }
    .details dt { font-weight: 600; color: var(--gray-dark); margin: 0; font-size: .85rem; }
    .details dd { margin: 0; color: var(--gray-text); font-size: .9rem; word-break: break-word; }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 1rem; }
      .details div { grid-template-columns: 1fr; gap: 0; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  meusCaes: Cao[] = [];
  loading = true;
  errorMessage = '';
  selectedCao: Cao | null = null;
  addresses: Record<string, string> = {};

  constructor(private caoService: CaoService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.caoService.getMeusCaes().subscribe({
      next: (caes) => {
        this.meusCaes = caes;
        this.loading = false;
        this.resolverEnderecos(caes);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erro ao carregar dados';
        this.loading = false;
      }
    });
  }

  private async resolverEnderecos(caes: Cao[]): Promise<void> {
    for (const cao of caes) {
      const lat = cao.localizacaoPerdido.latitude;
      const lng = cao.localizacaoPerdido.longitude;
      const textoCached = [cao.localizacaoPerdido.bairro, cao.localizacaoPerdido.cidade, cao.localizacaoPerdido.estado]
        .filter(Boolean).join(', ');

      if (textoCached) { this.addresses[cao.id] = textoCached; continue; }
      if (!lat || !lng) { this.addresses[cao.id] = 'Localização não informada'; continue; }

      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'CaoRadar/1.0' } }
        );
        const data = await resp.json();
        const a = data?.address;
        const partes = [
          a?.road || a?.pedestrian,
          a?.suburb || a?.neighbourhood,
          a?.city || a?.town || a?.village,
          a?.state
        ].filter(Boolean);
        this.addresses[cao.id] = partes.slice(0, 3).join(', ') || data?.display_name?.split(',').slice(0,3).join(',').trim() || 'Endereço não encontrado';
      } catch {
        this.addresses[cao.id] = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  marcarEncontrado(cao: Cao): void {
    if (confirm(`Marcar ${cao.nome} como encontrado?`)) {
      this.caoService.marcarComoEncontrado(cao.id).subscribe({
        next: () => {
          this.meusCaes = this.meusCaes.map(c => c.id === cao.id ? { ...c, status: 'Encontrado' as const } : c);
        },
        error: (err) => { alert(err.message || 'Erro ao atualizar status'); }
      });
    }
  }

  deleteCao(id: string): void {
    if (confirm('Excluir este cadastro?')) {
      this.caoService.deleteCao(id).subscribe({
        next: () => {
          this.meusCaes = this.meusCaes.filter(c => c.id !== id);
        },
        error: (err) => {
          alert(err.message || 'Erro ao excluir');
        }
      });
    }
  }

  openDetails(cao: Cao): void {
    this.selectedCao = cao;
  }

  closeDetails(): void {
    this.selectedCao = null;
  }

  localTexto(cao: Cao): string {
    const parts = [cao.localizacaoPerdido.bairro, cao.localizacaoPerdido.cidade, cao.localizacaoPerdido.estado].filter(Boolean);
    return parts.join(', ') || 'Não informado';
  }
}
