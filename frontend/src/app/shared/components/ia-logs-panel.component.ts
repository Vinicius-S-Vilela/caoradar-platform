import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IaLogsService, IaLogEntry, IaLogsSource } from '../../core/services/ia-logs.service';

interface LocalStats {
  total: number;
  errors: number;
  videos: number;
  matches: number;
}

@Component({
  selector: 'app-ia-logs-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ia-logs-wrapper" *ngIf="isAdmin">
      <button
        class="ia-logs-toggle"
        *ngIf="!expanded"
        (click)="toggle()"
        title="Abrir logs do IA Service"
      >
        <span class="ia-logs-toggle-icon">{{ '{' }}/{{ '}' }}</span>
        <span class="ia-logs-toggle-label">IA Logs</span>
        <span class="ia-logs-toggle-badge" *ngIf="stats.errors > 0">
          {{ stats.errors }}
        </span>
      </button>

      <div class="ia-logs-panel" *ngIf="expanded">
        <div class="ia-logs-header">
          <div class="ia-logs-title">
            <span class="ia-logs-dot"
                  [class.online]="connected"
                  [class.offline]="!connected"></span>
            <strong>IA Service · Logs</strong>
            <small class="ia-logs-mode">
              {{ connected ? 'streaming' : 'reconectando…' }}
            </small>
          </div>
          <div class="ia-logs-actions">
            <button
              class="ia-logs-btn"
              (click)="setSource('run')"
              [class.active]="source === 'run'"
              title="Logs do container"
            >
              run
            </button>
            <button
              class="ia-logs-btn"
              (click)="setSource('build')"
              [class.active]="source === 'build'"
              title="Logs de build"
            >
              build
            </button>
            <button
              class="ia-logs-btn"
              (click)="autoScroll = !autoScroll"
              [class.active]="autoScroll"
              title="Rolagem automática"
            >
              auto
            </button>
            <button class="ia-logs-btn" (click)="clearLocal()" title="Limpar visualização">
              limpar
            </button>
            <button class="ia-logs-btn ia-logs-close" (click)="toggle()" title="Fechar">
              ×
            </button>
          </div>
        </div>

        <div class="ia-logs-stats">
          <div class="stat">
            <span class="stat-label">Total</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Vídeos</span>
            <span class="stat-value">{{ stats.videos }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Matches</span>
            <span class="stat-value">{{ stats.matches }}</span>
          </div>
          <div class="stat stat-error" [class.highlight]="stats.errors > 0">
            <span class="stat-label">Erros</span>
            <span class="stat-value">{{ stats.errors }}</span>
          </div>
        </div>

        <div class="ia-logs-body" #body>
          <div class="ia-logs-empty" *ngIf="logs.length === 0 && connected">
            Aguardando logs do IA Service…
          </div>
          <div class="ia-logs-empty ia-logs-err" *ngIf="!connected && logs.length === 0">
            Sem conexão com o stream de logs.
            <br />
            <small>Verifique HF_TOKEN no backend.</small>
          </div>
          <div
            *ngFor="let log of logs; trackBy: trackById"
            class="ia-log-line"
            [class.is-error]="isErrorLine(log.message)"
            [class.is-api]="isApiLine(log.message)"
            [class.is-ok]="isOkLine(log.message)"
          >
            <span class="ia-log-time">{{ formatTime(log.timestamp) }}</span>
            <span class="ia-log-msg">{{ log.message }}</span>
          </div>
        </div>

        <div class="ia-logs-footer">
          <small>
            SSE proxy do HF · {{ logs.length }} linha(s) em buffer
          </small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ia-logs-wrapper {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 9998;
      font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    }

    .ia-logs-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.9rem;
      background: #111827;
      color: #f3f4f6;
      border: 1px solid #374151;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      font-size: 0.8rem;
      font-weight: 600;
      transition: transform 0.15s ease, background 0.15s ease;
    }
    .ia-logs-toggle:hover {
      background: #1f2937;
      transform: translateY(-1px);
    }
    .ia-logs-toggle-icon {
      color: #60a5fa;
      font-weight: 700;
    }
    .ia-logs-toggle-badge {
      background: #ef4444;
      color: #fff;
      border-radius: 999px;
      padding: 0.1rem 0.45rem;
      font-size: 0.7rem;
      font-weight: 700;
      min-width: 1.25rem;
      text-align: center;
    }

    .ia-logs-panel {
      width: 480px;
      max-width: calc(100vw - 2rem);
      height: 70vh;
      max-height: 680px;
      background: #0b1020;
      color: #e5e7eb;
      border: 1px solid #1f2937;
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .ia-logs-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.6rem 0.85rem;
      background: #111827;
      border-bottom: 1px solid #1f2937;
      gap: 0.5rem;
    }
    .ia-logs-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #f9fafb;
      min-width: 0;
    }
    .ia-logs-mode {
      color: #9ca3af;
      font-size: 0.7rem;
      font-weight: 400;
    }
    .ia-logs-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #6b7280;
      box-shadow: 0 0 0 3px rgba(107, 114, 128, 0.2);
      flex-shrink: 0;
    }
    .ia-logs-dot.online {
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
      animation: pulse 2s infinite;
    }
    .ia-logs-dot.offline {
      background: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25);
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.5; }
    }

    .ia-logs-actions {
      display: flex;
      gap: 0.3rem;
      flex-wrap: wrap;
    }
    .ia-logs-btn {
      background: #1f2937;
      color: #d1d5db;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.7rem;
      font-family: inherit;
      transition: background 0.15s ease;
    }
    .ia-logs-btn:hover  { background: #374151; }
    .ia-logs-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; }
    .ia-logs-close {
      font-size: 1rem;
      line-height: 1;
      padding: 0.15rem 0.45rem;
    }

    .ia-logs-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.4rem;
      padding: 0.6rem 0.85rem;
      background: #0f172a;
      border-bottom: 1px solid #1f2937;
    }
    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.35rem 0.2rem;
      background: #111827;
      border-radius: 6px;
    }
    .stat-label {
      font-size: 0.65rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 1.05rem;
      font-weight: 700;
      color: #f9fafb;
    }
    .stat-error.highlight .stat-value { color: #f87171; }

    .ia-logs-body {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      line-height: 1.45;
      background: #0b1020;
      scrollbar-width: thin;
      scrollbar-color: #374151 #0b1020;
    }
    .ia-logs-body::-webkit-scrollbar        { width: 6px; }
    .ia-logs-body::-webkit-scrollbar-thumb  { background: #374151; border-radius: 3px; }

    .ia-logs-empty {
      color: #6b7280;
      text-align: center;
      padding: 2rem 1rem;
      font-size: 0.8rem;
    }
    .ia-logs-err { color: #f87171; }

    .ia-log-line {
      display: flex;
      gap: 0.5rem;
      padding: 0.2rem 0;
      border-bottom: 1px solid rgba(31, 41, 55, 0.5);
      word-break: break-word;
      white-space: pre-wrap;
    }
    .ia-log-time {
      color: #6b7280;
      flex-shrink: 0;
      font-size: 0.7rem;
    }
    .ia-log-msg {
      color: #e5e7eb;
      flex: 1;
      min-width: 0;
    }

    .ia-log-line.is-error .ia-log-msg { color: #fca5a5; }
    .ia-log-line.is-api   .ia-log-msg { color: #93c5fd; }
    .ia-log-line.is-ok    .ia-log-msg { color: #86efac; }

    .ia-logs-footer {
      padding: 0.4rem 0.85rem;
      background: #111827;
      border-top: 1px solid #1f2937;
      text-align: center;
      color: #6b7280;
      font-size: 0.7rem;
    }

    @media (max-width: 600px) {
      .ia-logs-panel { width: calc(100vw - 2rem); height: 70vh; }
      .ia-logs-stats { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class IaLogsPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('body') bodyRef?: ElementRef<HTMLDivElement>;

  private static readonly MAX_BUFFER = 1000;

  expanded = false;
  autoScroll = true;
  connected = false;
  logs: IaLogEntry[] = [];
  stats: LocalStats = { total: 0, errors: 0, videos: 0, matches: 0 };
  source: IaLogsSource = 'run';

  private sub?: Subscription;
  private shouldScroll = false;
  private nextLocalId = 1;

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  constructor(
    private authService: AuthService,
    private iaLogsService: IaLogsService,
  ) {}

  ngOnInit(): void {
    if (!this.isAdmin) return;
    this.openStream();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.bodyRef) {
      const el = this.bodyRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggle(): void {
    this.expanded = !this.expanded;
    if (this.expanded) this.shouldScroll = this.autoScroll;
  }

  clearLocal(): void {
    this.logs = [];
    this.stats = { total: 0, errors: 0, videos: 0, matches: 0 };
  }

  setSource(source: IaLogsSource): void {
    if (this.source === source) return;
    this.source = source;
    this.clearLocal();
    this.openStream();
  }

  trackById(_: number, log: IaLogEntry): number {
    return log.id;
  }

  formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('pt-BR', { hour12: false });
    } catch {
      return '';
    }
  }

  isErrorLine(msg: string): boolean {
    return msg.includes('❌') || /\berro\b/i.test(msg);
  }

  isApiLine(msg: string): boolean {
    return msg.includes('[API]');
  }

  isOkLine(msg: string): boolean {
    return msg.includes('✅');
  }

  private openStream(): void {
    this.sub?.unsubscribe();
    this.connected = false;

    this.sub = this.iaLogsService.stream(this.source).subscribe({
      next: (ev) => {
        if (ev.type === 'log') {
          this.connected = true;
          this.appendEntry(ev.entry);
        } else if (ev.type === 'info') {
          this.connected = true;
          this.appendEntry({
            id: this.nextLocalId++,
            timestamp: new Date().toISOString(),
            message: ev.message,
          });
        } else if (ev.type === 'error') {
          this.connected = false;
        }
      },
      error: () => {
        this.connected = false;
      },
    });
  }

  private appendEntry(raw: IaLogEntry): void {
    // Garante id único local mesmo se o backend reiniciar a contagem.
    const entry: IaLogEntry = {
      id: this.nextLocalId++,
      timestamp: raw.timestamp,
      message: raw.message,
    };

    this.logs = [...this.logs, entry].slice(-IaLogsPanelComponent.MAX_BUFFER);
    this.updateStats(entry.message);
    this.shouldScroll = this.autoScroll && this.expanded;
  }

  private updateStats(msg: string): void {
    this.stats.total++;
    if (msg.includes('❌') || /\berro\b/i.test(msg)) this.stats.errors++;
    if (msg.includes('/api/video/process'))         this.stats.videos++;
    if (msg.includes('/api/match/relato'))          this.stats.matches++;
  }
}
