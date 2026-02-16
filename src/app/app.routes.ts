import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./features/home/home.routes').then((m) => m.homeRoutes),
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
