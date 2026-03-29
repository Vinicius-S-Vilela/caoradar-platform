import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Serviço centralizado de comunicação com a API
 * Base URL: https://api-caoradar.onrender.com
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BASE_URL = '/api-proxy';

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.BASE_URL}${path}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST request
   */
  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}${path}`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * PUT request
   */
  put<T>(path: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL}${path}`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE request
   */
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}${path}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Tratamento centralizado de erros HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Erro ao comunicar com o servidor';

    if (error.status === 0) {
      message = 'Sem conexão com o servidor. Verifique sua internet.';
    } else if (error.status === 400) {
      message = typeof error.error === 'string' ? error.error : 'Dados inválidos';
    } else if (error.status === 401) {
      message = typeof error.error === 'string' ? error.error : 'Credenciais inválidas';
    } else if (error.status === 404) {
      message = 'Recurso não encontrado';
    } else if (error.status === 500) {
      message = 'Erro ao processar. Verifique se email ou CPF já estão cadastrados.';
    }

    return throwError(() => new Error(message));
  }
}
