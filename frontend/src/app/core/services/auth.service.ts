import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserLogin, UserRegister } from '../models/user.model';

/**
 * Serviço de Autenticação
 * Gerencia login, logout, registro e estado do usuário autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Subject para armazenar o usuário atual
  private currentUserSubject: BehaviorSubject<User | null>;
  
  // Observable público do usuário atual
  public currentUser$: Observable<User | null>;

  // Lista de usuários mockados (simulando banco de dados)
  private users: User[] = [
    {
      id: '1',
      nome: 'Usuário Teste',
      email: 'usuario@teste.com',
      senha: 'senha123',
      isAdmin: false,
      telefone: '(11) 98765-4321',
      dataCadastro: new Date('2024-01-15')
    },
    {
      id: '2',
      nome: 'Administrador',
      email: 'admin@cao-radar.com',
      senha: 'admin123',
      isAdmin: true,
      telefone: '(11) 91234-5678',
      dataCadastro: new Date('2024-01-01')
    },
    {
      id: '3',
      nome: 'Maria Silva',
      email: 'maria@email.com',
      senha: 'maria123',
      isAdmin: false,
      telefone: '(11) 99876-5432',
      dataCadastro: new Date('2024-02-10')
    }
  ];

  constructor() {
    // Tenta recuperar usuário do localStorage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Obtém o valor atual do usuário
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Realiza o login do usuário
   */
  login(credentials: UserLogin): Observable<User> {
    // Simula delay de requisição
    return of(null).pipe(
      delay(800),
      map(() => {
        // Busca usuário na lista
        const user = this.users.find(
          u => u.email === credentials.email && u.senha === credentials.senha
        );

        if (!user) {
          throw new Error('Email ou senha inválidos');
        }

        // Remove a senha antes de retornar
        const { senha, ...userWithoutPassword } = user;
        
        // Salva no localStorage
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // Atualiza o subject
        this.currentUserSubject.next(userWithoutPassword);
        
        return userWithoutPassword;
      })
    );
  }

  /**
   * Registra um novo usuário
   */
  register(userData: UserRegister): Observable<User> {
    // Simula delay de requisição
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Verifica se email já existe
        const emailExists = this.users.some(u => u.email === userData.email);
        
        if (emailExists) {
          throw new Error('Este email já está cadastrado');
        }

        // Verifica se as senhas coincidem
        if (userData.senha !== userData.confirmarSenha) {
          throw new Error('As senhas não coincidem');
        }

        // Cria novo usuário
        const newUser: User = {
          id: (this.users.length + 1).toString(),
          nome: userData.nome,
          email: userData.email,
          senha: userData.senha,
          isAdmin: false,
          telefone: userData.telefone,
          dataCadastro: new Date()
        };

        // Adiciona à lista
        this.users.push(newUser);

        // Remove a senha antes de retornar
        const { senha, ...userWithoutPassword } = newUser;
        
        // Salva no localStorage
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        // Atualiza o subject
        this.currentUserSubject.next(userWithoutPassword);
        
        return userWithoutPassword;
      })
    );
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    // Remove do localStorage
    localStorage.removeItem('currentUser');
    
    // Atualiza o subject
    this.currentUserSubject.next(null);
  }

  /**
   * Verifica se o usuário está autenticado
   */
  isAuthenticated(): boolean {
    return this.currentUserValue !== null;
  }

  /**
   * Verifica se o usuário é admin
   */
  isAdmin(): boolean {
    return this.currentUserValue?.isAdmin || false;
  }

  /**
   * Retorna todos os usuários (apenas para admin)
   */
  getAllUsers(): Observable<User[]> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acesso negado'));
    }

    return of(this.users.map(u => {
      const { senha, ...userWithoutPassword } = u;
      return userWithoutPassword;
    })).pipe(delay(500));
  }

  /**
   * Atualiza dados do usuário
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw new Error('Usuário não encontrado');
        }

        // Atualiza o usuário
        this.users[userIndex] = {
          ...this.users[userIndex],
          ...userData
        };

        const { senha, ...userWithoutPassword } = this.users[userIndex];
        
        // Se for o usuário atual, atualiza o localStorage
        if (this.currentUserValue?.id === userId) {
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          this.currentUserSubject.next(userWithoutPassword);
        }
        
        return userWithoutPassword;
      })
    );
  }

  /**
   * Deleta um usuário (apenas para admin)
   */
  deleteUser(userId: string): Observable<boolean> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acesso negado'));
    }

    return of(null).pipe(
      delay(500),
      map(() => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw new Error('Usuário não encontrado');
        }

        // Remove o usuário
        this.users.splice(userIndex, 1);
        
        return true;
      })
    );
  }
}
