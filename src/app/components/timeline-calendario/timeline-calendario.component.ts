import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineService } from '../../services/timeline.service';
import {
  TimelineAgente,
  DiaAgente,
  TimelineMultipleResponse,
} from '../../models/timeline.model';

@Component({
  selector: 'app-timeline-calendario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-calendario.component.html',
  styleUrl: './timeline-calendario.component.scss',
})
export class TimelineCalendarioComponent implements OnInit {
  // Datos
  timelines: TimelineAgente[] = [];
  fechas: Date[] = [];
  hipotesisActual: 3 | 5 | 7 | 10 | 15 = 5;

  // Estados
  cargando = false;
  error: string | null = null;
  generando = false;

  // Filtros
  filtroEstado: 'TODOS' | 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO' = 'TODOS';
  filtroTop10: 'TODOS' | 'TOP10' | 'NO_TOP10' = 'TODOS';
  ordenamiento: 'userId' | 'pnlTotal' | 'diasConTrades' | 'roiPromedio' = 'userId';

  // Agente seleccionado para tooltip
  diaSeleccionado: { agente: TimelineAgente; dia: DiaAgente } | null = null;
  tooltipPosition = { x: 0, y: 0 };

  constructor(
    private timelineService: TimelineService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTimelines();
  }

  cargarTimelines(): void {
    this.cargando = true;
    this.error = null;
    console.log('[Timeline] Iniciando carga de timelines...');

    this.timelineService.obtenerTodosTimelines(this.hipotesisActual).subscribe({
      next: (response: TimelineMultipleResponse) => {
        console.log('[Timeline] Respuesta recibida:', response.success, 'Timelines:', response.timelines?.length);
        if (response.success && response.timelines.length > 0) {
          this.timelines = response.timelines;
          console.log('[Timeline] Construyendo fechas...');
          this.construirFechas();
          console.log('[Timeline] Fechas construidas:', this.fechas.length);
          this.aplicarOrdenamiento();
          console.log('[Timeline] Ordenamiento aplicado');
        } else {
          this.error =
            'No se encontraron timelines. Genere primero los datos usando el botón "Generar Timeline".';
        }
        this.cargando = false;
        console.log('[Timeline] Carga completada, cargando =', this.cargando);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Timeline] Error al cargar timelines:', err);
        if (err.status === 404) {
          this.error =
            'No se encontraron timelines para esta hipótesis. Genere primero los datos usando el botón "Generar Timeline".';
        } else if (err.status === 0) {
          this.error =
            'No se puede conectar con el servidor. Verifique que el backend esté corriendo en http://localhost:3000';
        } else {
          this.error = `Error al cargar los timelines: ${err.message || 'Error desconocido'}`;
        }
        this.cargando = false;
      },
    });
  }

  generarTimeline(): void {
    if (
      !confirm(
        '¿Está seguro de generar/regenerar el timeline? Esto puede tomar varios minutos.'
      )
    ) {
      return;
    }

    this.generando = true;
    this.error = null;

    this.timelineService
      .generarTimeline(this.hipotesisActual, undefined, true)
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert(`Timeline generado exitosamente. Total: ${response.totalGenerados} agentes.`);
            this.cargarTimelines();
          } else {
            this.error = response.message || 'Error al generar timeline';
          }
          this.generando = false;
        },
        error: (err) => {
          console.error('Error al generar timeline:', err);
          this.error = 'Error al generar el timeline. Intente nuevamente.';
          this.generando = false;
        },
      });
  }

  construirFechas(): void {
    if (this.timelines.length === 0) return;

    const fechasSet = new Set<string>();
    this.timelines.forEach((timeline) => {
      timeline.diasSimulados.forEach((dia) => {
        // Extraer solo la parte de fecha (YYYY-MM-DD) para evitar problemas de timezone
        const fechaStr = typeof dia.fecha === 'string'
          ? dia.fecha.split('T')[0]
          : new Date(dia.fecha).toISOString().split('T')[0];
        fechasSet.add(fechaStr);
      });
    });

    // Crear fechas en UTC para evitar conversión a timezone local
    this.fechas = Array.from(fechasSet)
      .map((f) => this.parsearFechaUTC(f))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  // Parsea una fecha string (YYYY-MM-DD) como UTC para evitar offset de timezone
  private parsearFechaUTC(fechaStr: string): Date {
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  get timelinesFiltrados(): TimelineAgente[] {
    let filtered = [...this.timelines];

    // Filtro por estado
    if (this.filtroEstado !== 'TODOS') {
      filtered = filtered.filter(
        (t) =>
          t.diasSimulados.some((d) => d.estadoAgente === this.filtroEstado)
      );
    }

    // Filtro por TOP10
    if (this.filtroTop10 === 'TOP10') {
      filtered = filtered.filter((t) => t.diasSimulados.some((d) => d.estaEnTop10));
    } else if (this.filtroTop10 === 'NO_TOP10') {
      filtered = filtered.filter((t) => !t.diasSimulados.some((d) => d.estaEnTop10));
    }

    return filtered;
  }

  aplicarOrdenamiento(): void {
    switch (this.ordenamiento) {
      case 'userId':
        this.timelines.sort((a, b) => a.userId.localeCompare(b.userId));
        break;
      case 'pnlTotal':
        this.timelines.sort((a, b) => b.resumen.pnlAcumulado - a.resumen.pnlAcumulado);
        break;
      case 'diasConTrades':
        this.timelines.sort((a, b) => b.resumen.diasConTrades - a.resumen.diasConTrades);
        break;
      case 'roiPromedio':
        const calcRoiProm = (t: TimelineAgente) =>
          t.resumen.pnlAcumulado / t.resumen.totalDias;
        this.timelines.sort((a, b) => calcRoiProm(b) - calcRoiProm(a));
        break;
    }
  }

  cambiarOrden(orden: 'userId' | 'pnlTotal' | 'diasConTrades' | 'roiPromedio'): void {
    this.ordenamiento = orden;
    this.aplicarOrdenamiento();
  }

  obtenerDia(timeline: TimelineAgente, fecha: Date): DiaAgente | null {
    // Usar getUTCFullYear, getUTCMonth, getUTCDate para evitar problemas de timezone
    const year = fecha.getUTCFullYear();
    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const day = String(fecha.getUTCDate()).padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;

    return (
      timeline.diasSimulados.find((d) => {
        const diaFechaStr = typeof d.fecha === 'string'
          ? d.fecha.split('T')[0]
          : new Date(d.fecha).toISOString().split('T')[0];
        return diaFechaStr === fechaStr;
      }) || null
    );
  }

  obtenerClaseDia(dia: DiaAgente | null): string {
    if (!dia) return 'dia-sin-datos';
    if (!dia.tieneTrades) return 'dia-sin-trades';
    if (dia.esPositivo) return 'dia-positivo';
    return 'dia-negativo';
  }

  mostrarTooltip(event: MouseEvent, agente: TimelineAgente, dia: DiaAgente): void {
    this.diaSeleccionado = { agente, dia };
    this.actualizarPosicionTooltip(event);
  }

  actualizarPosicionTooltip(event: MouseEvent): void {
    const tooltipWidth = 300;
    const tooltipHeight = 280;
    const padding = 15;

    let x = event.clientX + padding;
    let y = event.clientY + padding;

    // Ajustar si se sale por la derecha
    if (x + tooltipWidth > window.innerWidth) {
      x = event.clientX - tooltipWidth - padding;
    }

    // Ajustar si se sale por abajo
    if (y + tooltipHeight > window.innerHeight) {
      y = event.clientY - tooltipHeight - padding;
    }

    // Asegurar que no se salga por arriba o izquierda
    x = Math.max(padding, x);
    y = Math.max(padding, y);

    this.tooltipPosition = { x, y };
  }

  ocultarTooltip(): void {
    this.diaSeleccionado = null;
  }

  formatearFecha(fecha: Date | string): string {
    // Manejar tanto Date como string (desde el backend)
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [, month, day] = fechaStr.split('T')[0].split('-').map(Number);
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${day} ${meses[month - 1]}`;
  }

  // Formato de fecha completa para el tooltip (dd/MM/yyyy) - sin conversión de timezone
  formatearFechaCompleta(fecha: Date | string): string {
    const fechaStr = typeof fecha === 'string' ? fecha : fecha.toISOString();
    const [year, month, day] = fechaStr.split('T')[0].split('-').map(Number);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  }

  // Formato de fecha más corto para el header del grid (solo día) - usando UTC
  formatearFechaCorta(fecha: Date): string {
    const day = fecha.getUTCDate();
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = meses[fecha.getUTCMonth()];
    return `${day}/${month}`;
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(valor);
  }

  // Formato de moneda compacto para el grid
  formatearMonedaCorta(valor: number): string {
    const absVal = Math.abs(valor);
    const signo = valor < 0 ? '-' : '';

    if (absVal >= 1000) {
      return `${signo}$${(absVal / 1000).toFixed(1)}k`;
    }
    return `${signo}$${absVal.toFixed(0)}`;
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }
}
