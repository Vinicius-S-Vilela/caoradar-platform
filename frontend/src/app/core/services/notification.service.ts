import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  type: 'success' | 'warning' | 'error' | 'match';
  title: string;
  message: string;
  duration?: number;
  matchData?: {
    relatoId: string;
    nomeCao: string;
    score: number;
    snapshotUrl: string;
    local: string;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private counter = 0;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  show(type: Notification['type'], title: string, message: string, duration = 5000): void {
    const notification: Notification = {
      id: ++this.counter,
      type,
      title,
      message,
      duration
    };
    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(notification.id), duration);
    }
  }

  showMatch(matchData: Notification['matchData']): void {
    const notification: Notification = {
      id: ++this.counter,
      type: 'match',
      title: 'Match Encontrado!',
      message: `Possivel match para ${matchData?.nomeCao} - Score: ${((matchData?.score || 0) * 100).toFixed(0)}%`,
      duration: 0,
      matchData
    };
    this.notificationsSubject.next([...this.notificationsSubject.value, notification]);
  }

  dismiss(id: number): void {
    this.notificationsSubject.next(
      this.notificationsSubject.value.filter(n => n.id !== id)
    );
  }
}
