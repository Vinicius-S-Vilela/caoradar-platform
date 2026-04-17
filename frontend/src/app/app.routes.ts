import { Routes } from '@angular/router';
import { authGuard, adminGuard, noAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/menu',
    pathMatch: 'full'
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'menu',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'cadastro-cao',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/cadastro-cao/cadastro-cao.component').then(m => m.CadastroCaoComponent)
  },
  {
    path: 'caes-perdidos',
    loadComponent: () => import('./pages/caes-perdidos/caes-perdidos.component').then(m => m.CaesPerdidosComponent)
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/caes-encontrados/caes-encontrados.component').then(m => m.CaesEncontradosComponent)
  },
  {
    path: 'caes-encontrados',
    redirectTo: '/matches',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent)
  },
  {
    path: '**',
    redirectTo: '/menu'
  }
];
