import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'nueva-simulacion',
    loadComponent: () => import('./components/nueva-simulacion/nueva-simulacion.component').then(m => m.NuevaSimulacionComponent)
  },
  {
    path: 'timeline',
    loadComponent: () => import('./components/timeline/timeline.component').then(m => m.TimelineComponent)
  },
  {
    path: 'timeline-calendario',
    loadComponent: () => import('./components/timeline-calendario/timeline-calendario.component').then(m => m.TimelineCalendarioComponent)
  },
  {
    path: 'agente/:agenteId',
    loadComponent: () => import('./components/detalle-agente/detalle-agente.component').then(m => m.DetalleAgenteComponent)
  },
  {
    path: 'cuenta/:cuentaId',
    loadComponent: () => import('./components/detalle-cuenta/detalle-cuenta.component').then(m => m.DetalleCuentaComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
