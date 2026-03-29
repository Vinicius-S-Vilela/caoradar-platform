import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { User, UserLogin, UserRegister, UserBackend, mapBackendUserToUser } from '../models/user.model';
import { ApiService } from './api.service';

/**
 * Serviço de Autenticação
 * Integrado com a API real: https://api-caoradar.onrender.com
 *
 * Endpoints utilizados:
 * - POST /users          → Registro de novo usuário
 * - GET  /users/{email}  → Busca usuário por email (login provisório)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private api: ApiService) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Login via GET /users/{email}
   * O backend não possui autenticação JWT ainda.
   * Busca o usuário pelo email e compara a senha no frontend.
   */
  login(credentials: UserLogin): Observable<User> {
    return this.api.post<UserBackend>('/users/login', {
      email: credentials.email,
      senha: credentials.senha
    }).pipe(
      map((backendUser: UserBackend) => {
        console.log('[LOGIN] Resposta do backend:', backendUser);
        const user = mapBackendUserToUser(backendUser);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError((error) => {
        console.error('[LOGIN] Erro:', error);
        return throwError(() => new Error('Email ou senha inválidos'));
      })
    );
  }

  /**
   * Registro via POST /users
   */
  register(userData: UserRegister): Observable<User> {
    if (userData.senha !== userData.confirmarSenha) {
      return throwError(() => new Error('As senhas não coincidem'));
    }

    const payload = {
      nome: userData.nome,
      email: userData.email,
      cpf: userData.cpf,
      passwordHash: userData.senha,
      telefone: userData.telefone || null,
      role: 'TUTOR'
    };

    return this.api.post<UserBackend>('/users', payload).pipe(
      map((backendUser: UserBackend) => {
        const user = mapBackendUserToUser(backendUser);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError((error) => {
        return throwError(() => new Error(error.message || 'Erro ao criar conta'));
      })
    );
  }

  /**
   * Logout - limpa estado local
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  isAdmin(): boolean {
    return this.currentUserValue?.isAdmin || false;
  }

  /**
   * Retorna todos os usuários (admin)
   * NOTA: O backend não possui endpoint GET /users (retorna 405).
   * Retorna lista vazia até que o endpoint seja implementado.
   */
  getAllUsers(): Observable<User[]> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acesso negado'));
    }
    // Backend não suporta listar todos os usuários ainda
    return of([]);
  }

  /**
   * Atualiza dados do usuário
   * NOTA: O backend não possui endpoint PUT /users/{id}.
   * Atualiza apenas localmente até que o endpoint seja implementado.
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    const currentUser = this.currentUserValue;
    if (currentUser && currentUser.id === userId) {
      const updated = { ...currentUser, ...userData };
      localStorage.setItem('currentUser', JSON.stringify(updated));
      this.currentUserSubject.next(updated);
      return of(updated);
    }
    return throwError(() => new Error('Usuário não encontrado'));
  }

  /**
   * Deleta um usuário (admin)
   * NOTA: O backend não possui endpoint DELETE /users/{id}.
   * Operação não disponível no momento.
   */
  deleteUser(userId: string): Observable<boolean> {
    return throwError(() => new Error('Funcionalidade não disponível no momento'));
  }
}
