import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="register-page">
      <div class="register-container">
        <div class="register-content">
          <a routerLink="/" class="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Voltar
          </a>

          <div class="register-header">
            <img src="assets/images/Logo.png" alt="Cão Radar" class="register-Logo">
            <h1 class="register-title">Criar conta</h1>
            <p class="register-subtitle">Cadastre-se para começar a usar o Cão Radar</p>
          </div>

          <div class="alert alert-error" *ngIf="errorMessage">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ errorMessage }}
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="nome" class="form-label">Nome completo</label>
              <input
                id="nome"
                type="text"
                class="form-control"
                [class.error]="registerForm.get('nome')?.invalid && registerForm.get('nome')?.touched"
                formControlName="nome"
                placeholder="Seu nome"
              >
              <span class="form-error" *ngIf="registerForm.get('nome')?.invalid && registerForm.get('nome')?.touched">
                Nome é obrigatório
              </span>
            </div>

            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                formControlName="email"
                placeholder="seu@email.com"
              >
              <span class="form-error" *ngIf="registerForm.get('email')?.invalid && registerForm.get('email')?.touched">
                <span *ngIf="registerForm.get('email')?.errors?.['required']">Email é obrigatório</span>
                <span *ngIf="registerForm.get('email')?.errors?.['email']">Email inválido</span>
              </span>
            </div>

            <div class="form-group">
              <label for="cpf" class="form-label">CPF *</label>
              <input
                id="cpf"
                type="text"
                class="form-control"
                [class.error]="registerForm.get('cpf')?.invalid && registerForm.get('cpf')?.touched"
                formControlName="cpf"
                placeholder="000.000.000-00"
                maxlength="14"
              >
              <span class="form-error" *ngIf="registerForm.get('cpf')?.invalid && registerForm.get('cpf')?.touched">
                CPF é obrigatório
              </span>
            </div>

            <div class="form-group">
              <label for="telefone" class="form-label">Telefone (opcional)</label>
              <input
                id="telefone"
                type="tel"
                class="form-control"
                formControlName="telefone"
                placeholder="(00) 00000-0000"
              >
            </div>

            <div class="form-group">
              <label for="senha" class="form-label">Senha</label>
              <input
                id="senha"
                type="password"
                class="form-control"
                [class.error]="registerForm.get('senha')?.invalid && registerForm.get('senha')?.touched"
                formControlName="senha"
                placeholder="Mínimo 6 caracteres"
              >
              <span class="form-error" *ngIf="registerForm.get('senha')?.invalid && registerForm.get('senha')?.touched">
                <span *ngIf="registerForm.get('senha')?.errors?.['required']">Senha é obrigatória</span>
                <span *ngIf="registerForm.get('senha')?.errors?.['minlength']">Senha deve ter no mínimo 6 caracteres</span>
              </span>
            </div>

            <div class="form-group">
              <label for="confirmarSenha" class="form-label">Confirmar senha</label>
              <input
                id="confirmarSenha"
                type="password"
                class="form-control"
                [class.error]="registerForm.get('confirmarSenha')?.invalid && registerForm.get('confirmarSenha')?.touched"
                formControlName="confirmarSenha"
                placeholder="Digite a senha novamente"
              >
              <span class="form-error" *ngIf="registerForm.get('confirmarSenha')?.invalid && registerForm.get('confirmarSenha')?.touched">
                As senhas não coincidem
              </span>
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="registerForm.invalid || loading"
            >
              <span *ngIf="loading" class="spinner"></span>
              {{ loading ? 'Cadastrando...' : 'Criar conta' }}
            </button>
          </form>

          <div class="form-footer">
            <p>
              Já tem uma conta?
              <a routerLink="/login" class="link-primary">Entrar</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--secondary-blue) 0%, var(--white) 100%);
      padding: 2rem 1rem;
    }

    .register-container {
      max-width: 500px;
      width: 100%;
      background-color: var(--white);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      animation: fadeIn 0.5s ease-out;
    }

    .register-content {
      padding: 2.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--gray-text);
      text-decoration: none;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
      transition: color 0.2s ease;
    }

    .back-link:hover {
      color: var(--primary-blue);
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    // .register-logo {
    //   width: 70px;
    //   height: auto;
    //   margin-bottom: 1rem;
    // }

    .register-Logo {
     // gap: 0.5rem;
      padding: 1.1rem 0rem 0.001rem;
      padding-left: 1.1rem;
      width: 200px;
      height: auto;
      margin-top: -6rem;
      margin-bottom: -4rem;
      transition: transform 0.3s ease;
    }

    .register-logo:hover {
      transform: scale(1.1);
    }

    .register-title {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 700;
      justify-content: flex-start;
      //padding-top: 5vh;
      color: var(--gray-dark);
      margin-bottom: 0.5rem;
    }

    .register-subtitle {
      color: var(--gray-text);
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

    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
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

    @media (max-width: 480px) {
      .register-content {
        padding: 1.5rem;
      }

      .register-title {
        font-size: 1.75rem;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required]],
      telefone: [''],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const senha = form.get('senha');
    const confirmarSenha = form.get('confirmarSenha');
    
    if (senha && confirmarSenha && senha.value !== confirmarSenha.value) {
      confirmarSenha.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage = error.message || 'Erro ao criar conta';
        this.loading = false;
      }
    });
  }
}
