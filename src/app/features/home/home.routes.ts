import { Routes } from '@angular/router';

export const homeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home.page').then((m) => m.HomePage),
  },
  {
    path: 'nueva-visita',
    loadComponent: () =>
      import('./nueva-visita/nueva-visita.page').then((m) => m.NuevaVisitaPage),
  },
  {
    path: 'visita/:id',
    loadComponent: () =>
      import('./detalle-visita/detalle-visita.page').then((m) => m.DetalleVisitaPage),
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
    loadComponent: () =>
      import('./registros-pendientes/registros-pendientes.page').then(
        (m) => m.RegistrosPendientesPage
      ),
  },
  {
    path: 'registrar-vigilante',
    loadComponent: () =>
      import('./registrar-vigilante').then((m) => m.RegistrarVigilantePage),
  },
];
