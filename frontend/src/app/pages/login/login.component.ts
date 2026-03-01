import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

/**
 * Componente de Login
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-container">
        <!-- Lado esquerdo - Imagem/Branding -->
        <div class="login-side">
          <div class="login-side-content">
            <img src="assets/images/Logo.png" alt="Cão Radar" class="login-logo">
            <h1 class="login-side-title">Bem-vindo ao<br><span>Cão Radar</span></h1>
            <p class="login-side-text">
              Sistema inteligente de localização de cães perdidos utilizando tecnologia de visão computacional.
            </p>
            <div class="login-side-features">
              <div class="feature">
                <div class="feature-icon">🎯</div>
                <div class="feature-text">
                  <strong>Detecção Precisa</strong>
                  <span>Identificação automática por raça</span>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">📹</div>
                <div class="feature-text">
                  <strong>Câmeras Públicas</strong>
                  <span>Monitoramento em tempo real</span>
                </div>
              </div>
              <div class="feature">
                <div class="feature-icon">🔔</div>
                <div class="feature-text">
                  <strong>Alertas Inteligentes</strong>
                  <span>Notificações instantâneas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lado direito - Formulário -->
        <div class="login-form-side">
          <div class="login-form-container">
            <h2 class="form-title">Entrar na conta</h2>
            <p class="form-subtitle">Acesse o painel e encontre seu pet</p>

            <!-- Mensagem de erro -->
            <div class="alert alert-error" *ngIf="errorMessage">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMessage }}
            </div>

            <!-- Formulário -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  [class.error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
                  formControlName="email"
                  placeholder="seu@email.com"
                >
                <span class="form-error" *ngIf="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                  <span *ngIf="loginForm.get('email')?.errors?.['required']">Email é obrigatório</span>
                  <span *ngIf="loginForm.get('email')?.errors?.['email']">Email inválido</span>
                </span>
              </div>

              <div class="form-group">
                <label for="senha" class="form-label">Senha</label>
                <div class="password-input-wrapper">
                  <input
                    id="senha"
                    [type]="showPassword ? 'text' : 'password'"
                    class="form-control"
                    [class.error]="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched"
                    formControlName="senha"
                    placeholder="••••••••"
                  >
                  <button
                    type="button"
                    class="toggle-password"
                    (click)="togglePassword()"
                    tabindex="-1"
                  >
                    <svg *ngIf="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg *ngIf="showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
                <span class="form-error" *ngIf="loginForm.get('senha')?.invalid && loginForm.get('senha')?.touched">
                  <span *ngIf="loginForm.get('senha')?.errors?.['required']">Senha é obrigatória</span>
                </span>
              </div>

              <button
                type="submit"
                class="btn btn-primary btn-block"
                [disabled]="loginForm.invalid || loading"
              >
                <span *ngIf="loading" class="spinner"></span>
                {{ loading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>

            <!-- Credenciais de teste -->
            <div class="test-credentials">
              <p class="test-credentials-title">🔑 Credenciais de teste:</p>
              <div class="test-credential-item">
                <strong>Usuário:</strong> usuario&#64;teste.com | <strong>Senha:</strong> senha123
              </div>
              <div class="test-credential-item">
                <strong>Admin:</strong> admin&#64;cao-radar.com | <strong>Senha:</strong> admin123
              </div>
            </div>

            <!-- Link para cadastro -->
            <div class="form-footer">
              <p>
                Não tem uma conta?
                <a routerLink="/register" class="link-primary">Cadastre-se</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--secondary-blue) 0%, var(--white) 100%);
      padding: 2rem 1rem;
    }

    .login-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      max-width: 1100px;
      width: 100%;
      background-color: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      overflow: hidden;
      animation: fadeIn 0.5s ease-out;
    }

    /* Lado esquerdo */
    .login-side {
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
      color: var(--white);
      padding: 3rem;
      padding-top: 0.5rem;
      // padding: 2rem 3rem 3rem 3rem;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      position: relative;
      overflow: hidden;
    }

    .login-side::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      animation: pulse 15s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1) translate(0, 0); }
      50% { transform: scale(1.1) translate(-10%, -10%); }
    }

    // .login-side-content {
    //   position: relative;
    //   z-index: 1;
    // }

    // .login-logo {
    //   width: 80px;
    //   height: auto;
    //   margin-bottom: 2rem;
    //   filter: brightness(0) invert(1);
    // }
    .login-logo {
      gap: 0.5rem;
      padding: 1.1rem 0rem 0.001rem;
      width: 75px;
      height: auto;
      transition: transform 0.3s ease;
    }

    .login-logo:hover {
      transform: scale(1.1);
    }

    .login-side-title {
      font-family: var(--font-display);
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1rem;
    }

    .login-side-title span {
      background: linear-gradient(135deg, #FFF 0%, rgba(255,255,255,0.8) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .login-side-text {
      font-size: 1.05rem;
      line-height: 1.6;
      opacity: 0.9;
      margin-bottom: 2.5rem;
    }

    .login-side-features {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .feature {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .feature-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .feature-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .feature-text strong {
      font-size: 1rem;
      font-weight: 600;
    }

    .feature-text span {
      font-size: 0.9rem;
      opacity: 0.85;
    }

    /* Lado direito - Formulário */
    .login-form-side {
      padding: 3rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-form-container {
      width: 100%;
      max-width: 400px;
    }

    .form-title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-dark);
      margin-bottom: .5rem;
    }

    .form-subtitle {
      color: var(--gray-text);
      margin-bottom: 2rem;
      font-size: 1rem;
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      animation: slideInRight 0.3s ease-out;
    }

    .alert-error {
      background-color: rgba(235, 87, 87, 0.1);
      color: var(--error-red);
      border: 1px solid rgba(235, 87, 87, 0.3);
    }

    .password-input-wrapper {
      position: relative;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--gray-text);
      padding: 0.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    }

    .toggle-password:hover {
      color: var(--primary-blue);
    }

    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
    }

    .test-credentials {
      margin-top: 2rem;
      padding: 1rem;
      background-color: var(--secondary-blue);
      border-radius: var(--radius-md);
      border-left: 4px solid var(--primary-blue);
    }

    .test-credentials-title {
      font-weight: 600;
      color: var(--gray-dark);
      margin-bottom: 0.75rem;
      font-size: 0.9rem;
    }

    .test-credential-item {
      font-size: 0.85rem;
      color: var(--gray-text);
      margin-bottom: 0.25rem;
      font-family: 'Courier New', monospace;
    }

    .test-credential-item:last-child {
      margin-bottom: 0;
    }

    .form-footer {
      margin-top: 2rem;
      text-align: center;
      color: var(--gray-text);
    }

    .form-footer p {
      margin: 0;
    }

    .link-primary {
      color: var(--primary-blue);
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .link-primary:hover {
      color: var(--primary-blue-dark);
      text-decoration: underline;
    }

    /* Responsividade */
    @media (max-width: 968px) {
      .login-container {
        grid-template-columns: 1fr;
      }

      .login-side {
        padding: 2rem;
      }

      .login-side-title {
        font-size: 2rem;
      }

      .login-form-side {
        padding: 2rem;
      }
    }

    @media (max-width: 480px) {
      .login-page {
        padding: 1rem;
      }

      .login-side {
        padding: 1.5rem;
      }

      .login-side-title {
        font-size: 1.75rem;
      }

      .login-form-side {
        padding: 1.5rem;
      }

      .form-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inicializa o formulário
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required]]
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Erro ao fazer login';
        this.loading = false;
      }
    });
  }
}
