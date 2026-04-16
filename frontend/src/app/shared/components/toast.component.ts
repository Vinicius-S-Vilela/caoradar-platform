import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="toast-container">
      <div
        *ngFor="let n of notifications"
        class="toast"
        [class.toast-success]="n.type === 'success'"
        [class.toast-warning]="n.type === 'warning'"
        [class.toast-error]="n.type === 'error'"
        [class.toast-match]="n.type === 'match'"
      >
        <div class="toast-icon">
          <span *ngIf="n.type === 'success'">&#10003;</span>
          <span *ngIf="n.type === 'warning'">&#9888;</span>
          <span *ngIf="n.type === 'error'">&#10007;</span>
          <span *ngIf="n.type === 'match'">&#128062;</span>
        </div>
        <div class="toast-content">
          <strong class="toast-title">{{ n.title }}</strong>
          <p class="toast-message">{{ n.message }}</p>
          <div *ngIf="n.type === 'match' && n.matchData" class="toast-match-detail">
            <img [src]="n.matchData.snapshotUrl" alt="Match" class="match-thumb"
                 *ngIf="n.matchData.snapshotUrl"
                 onError="this.style.display='none'">
            <span class="match-score">{{ (n.matchData.score * 100).toFixed(0) }}% similar</span>
            <span class="match-local" *ngIf="n.matchData.local">{{ n.matchData.local }}</span>
          </div>
        </div>
        <button class="toast-close" (click)="dismiss(n.id)">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      background: white;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      border-left: 4px solid;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }

    .toast-success { border-color: #27ae60; }
    .toast-warning { border-color: #f39c12; }
    .toast-error { border-color: #e74c3c; }
    .toast-match { border-color: #2980b9; background: linear-gradient(135deg, #eaf4fd, #ffffff); }

    .toast-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .toast-success .toast-icon { color: #27ae60; }
    .toast-warning .toast-icon { color: #f39c12; }
    .toast-error .toast-icon { color: #e74c3c; }
    .toast-match .toast-icon { color: #2980b9; }

    .toast-content { flex: 1; min-width: 0; }
    .toast-title { font-size: 0.95rem; display: block; margin-bottom: 0.25rem; color: #2c3e50; }
    .toast-message { margin: 0; font-size: 0.85rem; color: #555; line-height: 1.4; }

    .toast-match-detail {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }
    .match-thumb {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
      border: 2px solid #2980b9;
    }
    .match-score {
      font-weight: 700;
      color: #2980b9;
      font-size: 0.85rem;
    }
    .match-local {
      font-size: 0.8rem;
      color: #777;
    }

    .toast-close {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: #aaa;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
    }
    .toast-close:hover { color: #555; }
  `]
})
export class ToastComponent {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {
    this.notificationService.notifications$.subscribe(n => this.notifications = n);
  }

  dismiss(id: number): void {
    this.notificationService.dismiss(id);
  }
}
