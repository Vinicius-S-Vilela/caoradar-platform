import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface IaLogEntry {
  id: number;
  timestamp: string;
  message: string;
}

export interface IaLogsStats {
  total: number;
  errors: number;
  videos_processados: number;
  matches_iniciados: number;
  last_id: number;
}

export interface IaLogsResponse {
  logs: IaLogEntry[];
  stats: IaLogsStats;
  source?: string;
}

export type IaLogsSource = 'run' | 'build';

export type IaLogsStreamEvent =
  | { type: 'log';   entry: IaLogEntry }
  | { type: 'info';  message: string }
  | { type: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class IaLogsService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /** Polling antigo — mantido como fallback. */
  getLogs(
    since: number = 0,
    limit: number = 500,
    source: IaLogsSource = 'run',
    force: boolean = false,
  ): Observable<IaLogsResponse> {
    const params = `since=${since}&limit=${limit}&source=${source}` + (force ? '&force=true' : '');
    return this.http.get<IaLogsResponse>(`${this.baseUrl}/admin/ia-logs?${params}`);
  }

  /**
   * Stream em tempo real via Server-Sent Events.
   * O backend faz proxy do /logs/{source} do Hugging Face — cada linha
   * vira um evento "log" assim que sai do stdout do IA Service.
   */
  stream(source: IaLogsSource = 'run'): Observable<IaLogsStreamEvent> {
    const url = `${this.baseUrl}/admin/ia-logs/stream?source=${source}`;
    return new Observable<IaLogsStreamEvent>((observer) => {
      const es = new EventSource(url, { withCredentials: false });

      es.addEventListener('log', (ev) => {
        try {
          const entry = JSON.parse((ev as MessageEvent).data) as IaLogEntry;
          observer.next({ type: 'log', entry });
        } catch {
          /* ignora linhas mal formadas */
        }
      });

      es.addEventListener('info', (ev) => {
        try {
          const { message } = JSON.parse((ev as MessageEvent).data);
          observer.next({ type: 'info', message });
        } catch {
          /**/
        }
      });

      es.addEventListener('error', (ev) => {
        // EventSource emite 'error' tanto em falha quanto em close — a própria
        // API tenta reconectar sozinha, então só sinalizamos status.
        if (es.readyState === EventSource.CLOSED) {
          observer.next({ type: 'error', message: 'conexão fechada' });
        }
      });

      return () => es.close();
    });
  }
}
