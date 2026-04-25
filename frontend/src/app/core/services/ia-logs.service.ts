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

@Injectable({ providedIn: 'root' })
export class IaLogsService {
  private readonly baseUrl = environment.iaUrl;

  constructor(private http: HttpClient) {}

  getLogs(
    since: number = 0,
    limit: number = 500,
    source: IaLogsSource = 'run',
  ): Observable<IaLogsResponse> {
    return this.http.get<IaLogsResponse>(
      `${this.baseUrl}/api/logs?since=${since}&limit=${limit}&source=${source}`
    );
  }
}
