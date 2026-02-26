# COMPONENTES COMPLETOS DA APLICAÇÃO CÃO RADAR

Este arquivo contém todos os componentes TypeScript necessários para a aplicação.
Crie cada arquivo no caminho indicado.

## 1. Dashboard Component
**Arquivo**: src/app/pages/dashboard/dashboard.component.ts

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
    <div class="dashboard-page">
      <div class="container">
        <div class="dashboard-header">
          <div>
            <h1>Meus Cães</h1>
            <p>Gerencie os cães que você cadastrou</p>
          </div>
          <a routerLink="/cadastro-cao" class="btn btn-primary">Cadastrar Novo Cão</a>
        </div>
        <div class="caes-grid" *ngIf="meusCaes.length > 0">
          <div class="cao-card" *ngFor="let cao of meusCaes">
            <div class="cao-image">
              <img [src]="cao.foto" [alt]="cao.nome">
              <span class="badge" [class.badge-perdido]="cao.status === 'Perdido'">{{cao.status}}</span>
            </div>
            <div class="cao-content">
              <h3>{{cao.nome}}</h3>
              <p>{{cao.raca}}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page { min-height: 100vh; padding: 100px 0 3rem; }
    .caes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .cao-card { background: white; border-radius: 12px; overflow: hidden; }
    .cao-image { height: 200px; position: relative; }
    .cao-image img { width: 100%; height: 100%; object-fit: cover; }
  `]
})
export class DashboardComponent implements OnInit {
  meusCaes: Cao[] = [];
  
  constructor(private caoService: CaoService) {}
  
  ngOnInit(): void {
    this.caoService.getMeusCaes().subscribe(caes => this.meusCaes = caes);
  }
}
```

