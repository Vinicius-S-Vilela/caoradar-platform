import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

/**
 * Componente de navegação principal
 */
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar" [class.scrolled]="isScrolled">
      <div class="navbar-container">
        <!-- Logo -->
        <a routerLink="/" class="navbar-logo">
          <img src="assets/images/Logo.png" alt="Cão Radar" class="logo-img">
          <!-- <span class="logo-text">Cão Radar</span> -->
        </a>

        <!-- Menu Desktop -->
        <div class="navbar-menu" [class.active]="menuOpen">
          <a 
            routerLink="/caes-perdidos" 
            routerLinkActive="active"
            class="navbar-link"
            (click)="closeMenu()"
          >
            Cães Perdidos
          </a>
          
          <!-- Links para usuário autenticado -->
          <ng-container *ngIf="currentUser">
            <a
              routerLink="/menu"
              routerLinkActive="active"
              class="navbar-link"
              (click)="closeMenu()"
            >
              Menu
            </a>

            <a
              routerLink="/matches"
              routerLinkActive="active"
              class="navbar-link"
              (click)="closeMenu()"
            >
              Matches
            </a>

            <a
              routerLink="/dashboard"
              routerLinkActive="active"
              class="navbar-link"
              (click)="closeMenu()"
            >
              Meus Cães
            </a>

            <a 
              routerLink="/cadastro-cao" 
              routerLinkActive="active"
              class="navbar-link highlight"
              (click)="closeMenu()"
            >
              Cadastrar Cão
            </a>

            <!-- Link admin -->
            <a 
              *ngIf="currentUser.isAdmin"
              routerLink="/admin" 
              routerLinkActive="active"
              class="navbar-link admin"
              (click)="closeMenu()"
            >
              Admin
            </a>
          </ng-container>
        </div>

        <!-- Área de usuário -->
        <div class="navbar-user">
          <ng-container *ngIf="currentUser; else loginButton">
            <div class="user-menu">
              <button class="user-button" (click)="toggleUserDropdown()">
                <div class="user-avatar">
                  {{ currentUser.nome.charAt(0).toUpperCase() }}
                </div>
                <span class="user-name">{{ currentUser.nome }}</span>
                <svg class="icon-dropdown" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>

              <!-- Dropdown -->
              <div class="user-dropdown" *ngIf="userDropdownOpen" (clickOutside)="closeUserDropdown()">
                <div class="dropdown-header">
                  <div class="dropdown-user-info">
                    <strong>{{ currentUser.nome }}</strong>
                    <span>{{ currentUser.email }}</span>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <a routerLink="/dashboard" class="dropdown-item" (click)="closeUserDropdown()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  Dashboard
                </a>
                <button class="dropdown-item" (click)="logout()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          </ng-container>

          <ng-template #loginButton>
            <a routerLink="/login" class="btn btn-primary btn-sm">
              Entrar
            </a>
          </ng-template>
        </div>

        <!-- Botão menu mobile -->
        <button class="navbar-toggle" (click)="toggleMenu()" [class.active]="menuOpen">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .navbar.scrolled {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .navbar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary-blue);
      transition: transform 0.2s ease;
    }

    .navbar-logo:hover {
      transform: scale(1.1);
    }

    .logo-img {
      gap: 0.5rem;
      padding: 1.1rem 0rem 0.001rem;
      width: 200px;
      height: auto;
      transition: transform 0.3s ease;
    }

    .logo-img:hover {
      transform: scale(1.1);
    }

    // .logo-img {
    //   height: 40px;
    //   width: auto;
    // }

    .logo-text {
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar-menu {
      display: flex;
      align-items: center;
      gap: 2rem;
      flex: 1;
      justify-content: center;
    }

    .navbar-link {
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      color: var(--gray-text);
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      position: relative;
    }

    .navbar-link:hover {
      color: var(--primary-blue);
      background-color: var(--secondary-blue);
    }

    .navbar-link.active {
      color: var(--primary-blue);
      font-weight: 600;
    }

    .navbar-link.active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 1rem;
      right: 1rem;
      height: 2px;
      background-color: var(--primary-blue);
      border-radius: 2px;
    }

    .navbar-link.highlight {
      background-color: var(--primary-blue);
      color: var(--white);
      font-weight: 600;
    }

    .navbar-link.highlight:hover {
      background-color: var(--primary-blue-dark);
      color: var(--white);
    }

    .navbar-link.admin {
      color: var(--error-red);
    }

    .navbar-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-menu {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: var(--secondary-blue);
      border: none;
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-body);
      color: var(--gray-dark);
    }

    .user-button:hover {
      background-color: var(--primary-blue);
      color: var(--white);
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }

    .user-name {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .icon-dropdown {
      transition: transform 0.2s ease;
    }

    .user-button:hover .icon-dropdown {
      transform: translateY(2px);
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      background-color: var(--white);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      min-width: 220px;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-header {
      padding: 1rem;
      background-color: var(--secondary-blue);
    }

    .dropdown-user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .dropdown-user-info strong {
      color: var(--gray-dark);
      font-size: 0.95rem;
    }

    .dropdown-user-info span {
      color: var(--gray-text);
      font-size: 0.8rem;
    }

    .dropdown-divider {
      height: 1px;
      background-color: var(--gray-light);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--gray-text);
      text-decoration: none;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      font-family: var(--font-body);
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dropdown-item:hover {
      background-color: var(--secondary-blue);
      color: var(--primary-blue);
    }

    .dropdown-item svg {
      stroke-width: 2;
    }

    .navbar-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
    }

    .navbar-toggle span {
      display: block;
      width: 25px;
      height: 3px;
      background-color: var(--primary-blue);
      border-radius: 2px;
      transition: all 0.3s ease;
    }

    .navbar-toggle.active span:nth-child(1) {
      transform: rotate(45deg) translate(8px, 8px);
    }

    .navbar-toggle.active span:nth-child(2) {
      opacity: 0;
    }

    .navbar-toggle.active span:nth-child(3) {
      transform: rotate(-45deg) translate(7px, -7px);
    }

    /* Responsividade */
    @media (max-width: 1024px) {
      .navbar-menu {
        gap: 1rem;
      }

      .user-name {
        display: none;
      }
    }

    @media (max-width: 768px) {
      .navbar-toggle {
        display: flex;
      }

      .navbar-menu {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        flex-direction: column;
        background-color: var(--white);
        padding: 1.5rem;
        gap: 0.5rem;
        box-shadow: var(--shadow-lg);
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .navbar-menu.active {
        transform: translateX(0);
      }

      .navbar-link {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class NavbarComponent {
  currentUser: User | null = null;
  menuOpen = false;
  userDropdownOpen = false;
  isScrolled = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Observa mudanças no usuário atual
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Detecta scroll
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled = window.scrollY > 20;
      });
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleUserDropdown(): void {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  closeUserDropdown(): void {
    this.userDropdownOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.closeUserDropdown();
    this.router.navigate(['/login']);
  }
}
