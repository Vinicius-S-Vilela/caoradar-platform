import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast.component';
import { IaLogsPanelComponent } from './shared/components/ia-logs-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent, IaLogsPanelComponent],
  template: `
    <app-toast></app-toast>
    <app-ia-logs-panel></app-ia-logs-panel>
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent {
  title = 'Cão Radar';
}
