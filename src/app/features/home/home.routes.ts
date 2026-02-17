import { Routes } from '@angular/router';
import { roleGuard } from '../../core/data/guards/role.guard';

export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home.page').then((m) => m.HomePage),
  },
  {
    path: 'nueva-visita',
    canActivate: [roleGuard('vecino', 'admin')],
    loadComponent: () =>
      import('./nueva-visita/nueva-visita.page').then((m) => m.NuevaVisitaPage),
  },
  {
    path: 'visita/:id',
    canActivate: [roleGuard('vecino', 'admin')],
    loadComponent: () =>
      import('./detalle-visita/detalle-visita.page').then((m) => m.DetalleVisitaPage),
  },
  {
    path: 'escanear-visita',
    canActivate: [roleGuard('vigilancia')],
    loadComponent: () =>
      import('./escanear-visita/escanear-visita.page').then(
        (m) => m.EscanearVisitaPage
      ),
  },
  {
    path: 'historial',
    loadComponent: () =>
      import('./historial-visitas/historial-visitas.page').then(
        (m) => m.HistorialVisitasPage
      ),
  },
  {
    path: 'registros-pendientes',
    canActivate: [roleGuard('admin')],
    loadComponent: () =>
      import('./registros-pendientes/registros-pendientes.page').then(
        (m) => m.RegistrosPendientesPage
      ),
  },
  {
    path: 'registrar-vigilante',
    canActivate: [roleGuard('admin')],
    loadComponent: () =>
      import('./registrar-vigilante').then((m) => m.RegistrarVigilantePage),
  },
  {
    path: 'vigilantes',
    canActivate: [roleGuard('admin')],
    loadComponent: () =>
      import('./vigilantes/vigilantes.page').then((m) => m.VigilantesPage),
  },
];
