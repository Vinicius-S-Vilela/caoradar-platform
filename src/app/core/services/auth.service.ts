import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError, timeout, retry } from 'rxjs/operators';
import { User, UserLogin, UserRegister, UserRegisterResponse, UserLoginResponse } from '../models/user.model';
import { API_CONFIG, getApiUrl } from '../config/api.config';

/**
 * Serviço de Autenticação
 * Suporta dois modos: API real ou dados mockados
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Subject para armazenar o usuário atual
  private currentUserSubject: BehaviorSubject<User | null>;
  
  // Observable público do usuário atual
  public currentUser$: Observable<User | null>;

  // Lista de usuários mockados (apenas para modo mock)
  private mockUsers: User[] = [
    {
      id: '1',
      nome: 'Usuário Teste',
      cpf: '123.456.789-00',
      email: 'usuario@teste.com',
      senha: 'senha123',
      role: 'TUTOR',
      telefone: '(11) 98765-4321',
      createdAt: new Date('2024-01-15')
    },
    {
      id: '2',
      nome: 'Administrador',
      cpf: '987.654.321-00',
      email: 'admin@cao-radar.com',
      senha: 'admin123',
      role: 'ADMIN',
      telefone: '(11) 91234-5678',
      createdAt: new Date('2024-01-01')
    }
  ];

  constructor() {
    // Tenta recuperar usuário do localStorage
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    console.log(`🔧 AuthService inicializado em modo: ${API_CONFIG.USE_MOCK_MODE ? 'MOCK' : 'API REAL'}`);
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
    if (API_CONFIG.USE_MOCK_MODE) {
      return this.loginMock(credentials);
    } else {
      return this.loginApi(credentials);
    }
  }

  /**
   * LOGIN - Modo Mock (local)
   */
  private loginMock(credentials: UserLogin): Observable<User> {
    console.log('🎭 LOGIN MOCK - Simulando autenticação local...');
    
    return of(null).pipe(
      delay(800),
      map(() => {
        const user = this.mockUsers.find(
          u => u.email === credentials.email && u.senha === credentials.senha
        );

        if (!user) {
          throw new Error('Email ou senha inválidos');
        }

        const { senha, ...userWithoutPassword } = user;
        
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        this.currentUserSubject.next(userWithoutPassword);
        
        console.log('✅ Login mock bem-sucedido:', userWithoutPassword);
        return userWithoutPassword;
      })
    );
  }

  /**
   * LOGIN - Modo API Real
   */
  private loginApi(credentials: UserLogin): Observable<User> {
    console.log('🌐 LOGIN API - Autenticando no backend...');
    console.log('🔗 URL:', getApiUrl(API_CONFIG.ENDPOINTS.LOGIN));

    return new Observable<User>(observer => {
      fetch(getApiUrl(API_CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.senha // Backend usa "password"
        })
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.message || `Erro HTTP: ${response.status}`);
          });
        }
        return response.json();
      })
      .then((data: UserLoginResponse) => {
        console.log('✅ Login API bem-sucedido:', data);

        // Converte resposta do backend para modelo frontend
        const user: User = {
          id: data.user.id,
          nome: data.user.nome,
          cpf: data.user.cpf,
          email: data.user.email,
          telefone: data.user.telefone,
          role: data.user.role,
          createdAt: data.user.createdAt ? new Date(data.user.createdAt) : undefined
        };

        // Salva token se vier
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        observer.next(user);
        observer.complete();
      })
      .catch(error => {
        console.error('❌ Erro no login API:', error);
        observer.error(error);
      });
    });
  }

  /**
   * Registra um novo usuário
   */
  register(userData: UserRegister): Observable<User> {
    if (API_CONFIG.USE_MOCK_MODE) {
      return this.registerMock(userData);
    } else {
      return this.registerApi(userData);
    }
  }

  /**
   * REGISTRO - Modo Mock (local)
   */
  private registerMock(userData: UserRegister): Observable<User> {
    console.log('🎭 REGISTRO MOCK - Simulando cadastro local...');
    
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Verifica se email já existe
        const emailExists = this.mockUsers.some(u => u.email === userData.email);
        if (emailExists) {
          throw new Error('Este email já está cadastrado');
        }

        // Verifica se CPF já existe
        const cpfExists = this.mockUsers.some(u => u.cpf === userData.cpf);
        if (cpfExists) {
          throw new Error('Este CPF já está cadastrado');
        }

        // Verifica se as senhas coincidem
        if (userData.senha !== userData.confirmarSenha) {
          throw new Error('As senhas não coincidem');
        }

        // Cria novo usuário
        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          nome: userData.nome,
          cpf: userData.cpf,
          email: userData.email,
          senha: userData.senha,
          telefone: userData.telefone,
          role: userData.role || 'TUTOR',
          createdAt: new Date()
        };

        // Adiciona à lista
        this.mockUsers.push(newUser);

        const { senha, ...userWithoutPassword } = newUser;
        
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        this.currentUserSubject.next(userWithoutPassword);
        
        console.log('✅ Registro mock bem-sucedido:', userWithoutPassword);
        return userWithoutPassword;
      })
    );
  }

  /**
   * REGISTRO - Modo API Real
   */
  private registerApi(userData: UserRegister): Observable<User> {
    console.log('🌐 REGISTRO API - Cadastrando no backend...');
    console.log('🔗 URL:', getApiUrl(API_CONFIG.ENDPOINTS.USERS));

    // Validação local antes de enviar
    if (userData.senha !== userData.confirmarSenha) {
      return throwError(() => new Error('As senhas não coincidem'));
    }

    return new Observable<User>(observer => {
      // Payload para o backend
      const payload = {
        nome: userData.nome,
        cpf: userData.cpf.replace(/\D/g, ''), // Remove formatação
        email: userData.email,
        password: userData.senha, // Backend usa "password"
        telefone: userData.telefone,
        role: userData.role || 'TUTOR'
      };

      console.log('📤 Enviando payload:', { ...payload, password: '***' });

      fetch(getApiUrl(API_CONFIG.ENDPOINTS.USERS), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.message || `Erro HTTP: ${response.status}`);
          }).catch(() => {
            throw new Error(`Erro HTTP: ${response.status}`);
          });
        }
        return response.json();
      })
      .then((data: UserRegisterResponse) => {
        console.log('✅ Registro API bem-sucedido:', data);

        // Converte resposta do backend para modelo frontend
        const user: User = {
          id: data.id,
          nome: data.nome,
          cpf: data.cpf,
          email: data.email,
          telefone: data.telefone,
          role: data.role,
          createdAt: new Date(data.createdAt)
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        
        observer.next(user);
        observer.complete();
      })
      .catch(error => {
        console.error('❌ Erro no registro API:', error);
        observer.error(error);
      });
    });
  }

  /**
   * Realiza o logout do usuário
   */
  logout(): void {
    console.log('👋 Logout realizado');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
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
    return this.currentUserValue?.role === 'ADMIN';
  }

  /**
   * Retorna todos os usuários (apenas para admin - apenas modo mock)
   */
  getAllUsers(): Observable<User[]> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acesso negado'));
    }

    if (API_CONFIG.USE_MOCK_MODE) {
      return of(this.mockUsers.map(u => {
        const { senha, ...userWithoutPassword } = u;
        return userWithoutPassword;
      })).pipe(delay(500));
    } else {
      // TODO: Implementar endpoint de listagem no backend
      return throwError(() => new Error('Endpoint de listagem não implementado no backend'));
    }
  }

  /**
   * Atualiza dados do usuário
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    if (API_CONFIG.USE_MOCK_MODE) {
      return this.updateUserMock(userId, userData);
    } else {
      // TODO: Implementar endpoint de atualização no backend
      return throwError(() => new Error('Endpoint de atualização não implementado no backend'));
    }
  }

  private updateUserMock(userId: string, userData: Partial<User>): Observable<User> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const userIndex = this.mockUsers.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          throw new Error('Usuário não encontrado');
        }

        this.mockUsers[userIndex] = {
          ...this.mockUsers[userIndex],
          ...userData
        };

        const { senha, ...userWithoutPassword } = this.mockUsers[userIndex];
        
        if (this.currentUserValue?.id === userId) {
          localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          this.currentUserSubject.next(userWithoutPassword);
        }
        
        return userWithoutPassword;
      })
    );
  }

  /**
   * Deleta um usuário (apenas para admin - apenas modo mock)
   */
  deleteUser(userId: string): Observable<boolean> {
    if (!this.isAdmin()) {
      return throwError(() => new Error('Acesso negado'));
    }

    if (API_CONFIG.USE_MOCK_MODE) {
      return of(null).pipe(
        delay(500),
        map(() => {
          const userIndex = this.mockUsers.findIndex(u => u.id === userId);
          
          if (userIndex === -1) {
            throw new Error('Usuário não encontrado');
          }

          this.mockUsers.splice(userIndex, 1);
          return true;
        })
      );
    } else {
      // TODO: Implementar endpoint de exclusão no backend
      return throwError(() => new Error('Endpoint de exclusão não implementado no backend'));
    }
  }
}