import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Cao, CaoCadastro, RacaCao, StatusCao, RelatoBackend, MatchBackend, mapRelatoToCao } from '../models/cao.model';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';

/**
 * Serviço de gerenciamento de cães (Relatos de Perda)
 * Integrado com a API real: https://api-caoradar.onrender.com
 *
 * Endpoints utilizados:
 * - GET  /relatos                    → Lista todos os relatos
 * - GET  /relatos/tutor/{tutorId}    → Lista relatos do usuário
 * - POST /relatos?tutorId={tutorId}  → Cria novo relato
 * - GET  /matches/relato/{relatoId}  → Lista matches de um relato
 */
@Injectable({
  providedIn: 'root'
})
export class CaoService {

  constructor(
    private authService: AuthService,
    private api: ApiService
  ) {}

  /**
   * Retorna todos os cães (relatos) via GET /relatos
   */
  getAllCaes(): Observable<Cao[]> {
    return this.api.get<RelatoBackend[]>('/relatos').pipe(
      map(relatos => (relatos || []).map(mapRelatoToCao)),
      catchError(() => of([]))
    );
  }

  /**
   * Retorna cães por status
   */
  getCaesByStatus(status: StatusCao): Observable<Cao[]> {
    return this.getAllCaes().pipe(
      map(caes => caes.filter(cao => cao.status === status))
    );
  }

  /**
   * Retorna cães perdidos (status = EM_BUSCA no backend)
   */
  getCaesPerdidos(): Observable<Cao[]> {
    return this.getAllCaes().pipe(
      map(caes => caes.filter(cao => cao.status === 'Perdido'))
    );
  }

  /**
   * Retorna cães encontrados (status = ENCONTRADO no backend)
   */
  getCaesEncontrados(): Observable<Cao[]> {
    return this.getAllCaes().pipe(
      map(caes => caes.filter(cao => cao.status === 'Encontrado'))
    );
  }

  /**
   * Retorna cães do usuário logado via GET /relatos/tutor/{tutorId}
   */
  getMeusCaes(): Observable<Cao[]> {
    const userId = this.authService.currentUserValue?.id;

    if (!userId) {
      console.warn('🔴 getMeusCaes: Usuário não autenticado');
      return of([]);
    }

    return this.api.get<RelatoBackend[]>(`/relatos/tutor/${userId}`).pipe(
      map(relatos => (relatos || []).map(mapRelatoToCao)),
      catchError((err) => {
        console.error('❌ getMeusCaes erro:', err);
        return of([]);
      })
    );
  }

  /**
   * Retorna cães filtrados por raça (filtro local)
   */
  getCaesByRaca(raca: RacaCao): Observable<Cao[]> {
    return this.getAllCaes().pipe(
      map(caes => caes.filter(cao => cao.raca === raca))
    );
  }

  /**
   * Retorna um cão específico por ID (busca na lista geral)
   */
  getCaoById(id: string): Observable<Cao | undefined> {
    return this.getAllCaes().pipe(
      map(caes => caes.find(cao => cao.id === id))
    );
  }

  /**
   * Cadastra um novo cão perdido via POST /relatos?tutorId={tutorId}
   */
  cadastrarCao(caoCadastro: CaoCadastro): Observable<Cao> {
    const userId = this.authService.currentUserValue?.id;

    if (!userId) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    // Concatena localização textual na descrição (backend não tem campo endereço)
    const loc = caoCadastro.localizacao;
    const locationStr = [loc.bairro, loc.cidade, loc.estado].filter(Boolean).join(', ');
    const descParts = [locationStr, caoCadastro.descricao || caoCadastro.observacoes].filter(Boolean);

    const payload = {
      nomeCao: caoCadastro.nome,
      descricao: descParts.join(' | ') || null,
      fotosUrl: caoCadastro.fotos?.length ? caoCadastro.fotos : [],
      latitude: caoCadastro.localizacao.latitude ?? null,
      longitude: caoCadastro.localizacao.longitude ?? null,
      dataDesaparecimento: caoCadastro.dataPerdido
        ? new Date(caoCadastro.dataPerdido).toISOString().slice(0, -1)
        : new Date().toISOString().slice(0, -1),
      raca: caoCadastro.raca || null,
      porteInformado: caoCadastro.porte || null,
      corPredominante: caoCadastro.cor || null
    };

    return this.api.post<RelatoBackend>(`/relatos?tutorId=${userId}`, payload).pipe(
      map(relato => mapRelatoToCao(relato)),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Erro ao cadastrar cão'));
      })
    );
  }

  /**
   * Atualiza um cão existente
   * NOTA: O backend não possui endpoint PUT /relatos/{id}.
   * Operação não disponível no momento.
   */
  updateCao(id: string, caoData: Partial<Cao>): Observable<Cao> {
    return throwError(() => new Error('Funcionalidade não disponível no momento'));
  }

  /**
   * Marca um cão como encontrado via PUT /relatos/{id}/status
   */
  marcarComoEncontrado(id: string): Observable<Cao> {
    return this.api.put<RelatoBackend>(`/relatos/${id}/status`, { status: 'ENCONTRADO' }).pipe(
      map(relato => mapRelatoToCao(relato)),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Erro ao atualizar status'));
      })
    );
  }

  deleteCao(id: string): Observable<boolean> {
    return this.api.delete<any>(`/relatos/${id}`).pipe(
      map(() => true),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Erro ao excluir'));
      })
    );
  }

  /**
   * Busca cães por termo (filtro local na lista completa)
   */
  buscarCaes(termo: string): Observable<Cao[]> {
    const termoLower = termo.toLowerCase();

    return this.getAllCaes().pipe(
      map(caes =>
        caes.filter(cao =>
          cao.nome.toLowerCase().includes(termoLower) ||
          cao.raca.toLowerCase().includes(termoLower) ||
          cao.localizacaoPerdido.cidade.toLowerCase().includes(termoLower) ||
          (cao.localizacaoPerdido.bairro?.toLowerCase().includes(termoLower) ?? false)
        )
      )
    );
  }

  /**
   * Retorna estatísticas calculadas a partir dos relatos reais
   */
  getEstatisticas(): Observable<{
    totalCaes: number;
    caesPerdidos: number;
    caesEncontrados: number;
    taxaEncontro: number;
  }> {
    return this.getAllCaes().pipe(
      map(caes => {
        const totalCaes = caes.length;
        const caesPerdidos = caes.filter(c => c.status === 'Perdido').length;
        const caesEncontrados = caes.filter(c => c.status === 'Encontrado').length;
        const taxaEncontro = totalCaes > 0 ? (caesEncontrados / totalCaes) * 100 : 0;

        return {
          totalCaes,
          caesPerdidos,
          caesEncontrados,
          taxaEncontro: Math.round(taxaEncontro)
        };
      })
    );
  }

  /**
   * Retorna matches de um relato via GET /matches/relato/{relatoId}
   * (Dependente do IA-Service para gerar matches)
   */
  getMatches(relatoId: string): Observable<MatchBackend[]> {
    return this.api.get<MatchBackend[]>(`/matches/relato/${relatoId}`).pipe(
      map(matches => matches || []),
      catchError(() => of([]))
    );
  }
}
