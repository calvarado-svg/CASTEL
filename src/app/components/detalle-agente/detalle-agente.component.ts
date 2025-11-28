import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Top10Service } from '../../services/top10.service';
import { RoiService } from '../../services/roi.service';
import { CuentasClientesService } from '../../services/cuentas-clientes.service';
import { DetalleAgenteEnRankingResponse, EventoTop10 } from '../../models/top10.model';
import { RoiPorHipotesisResponse, PeriodoRoi } from '../../models/roi.model';
import { CuentasPorAgenteResponse, HistorialMatrimoniosAgenteResponse } from '../../models/cuenta-cliente.model';

@Component({
  selector: 'app-detalle-agente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-agente.component.html',
  styleUrl: './detalle-agente.component.scss'
})
export class DetalleAgenteComponent implements OnInit {
  agenteId: string | null = null;
  hipotesisActual: 3 | 5 | 7 | 10 | 15 = 5;
  hipotesisOpciones: (3 | 5 | 7 | 10 | 15)[] = [3, 5, 7, 10, 15];

  detalleAgente: DetalleAgenteEnRankingResponse | null = null;
  roiData: RoiPorHipotesisResponse | null = null;
  cuentasData: CuentasPorAgenteResponse | null = null;
  historialMatrimonios: HistorialMatrimoniosAgenteResponse | null = null;

  cargando = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private top10Service: Top10Service,
    private roiService: RoiService,
    private cuentasService: CuentasClientesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.agenteId = params.get('agenteId');
      if (this.agenteId) {
        this.cargarDatos();
      }
    });
  }

  cargarDatos(): void {
    if (!this.agenteId) return;

    console.log('[DetalleAgente] Iniciando carga de datos para agente:', this.agenteId);
    console.log('[DetalleAgente] Hipótesis actual:', this.hipotesisActual);

    this.cargando = true;
    this.error = null;

    let completados = 0;
    const total = 4;

    // Timeout de 30 segundos
    const timeoutId = setTimeout(() => {
      if (completados < total) {
        console.error('[DetalleAgente] TIMEOUT: Algunos servicios no respondieron');
        this.cargando = false;
        this.error = 'Los datos están tardando mucho. El agente puede tener muchos períodos históricos.';
      }
    }, 30000);

    const marcarCompletado = (servicio: string) => {
      completados++;
      console.log(`[DetalleAgente] ${servicio} completado (${completados}/${total})`);
      if (completados >= total) {
        console.log('[DetalleAgente] Todos los servicios completados, ocultando spinner');
        clearTimeout(timeoutId);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };

    console.log('[DetalleAgente] Llamando a obtenerDetalleAgente...');
    this.top10Service.obtenerDetalleAgente(this.agenteId, this.hipotesisActual).subscribe({
      next: (data) => {
        console.log('[DetalleAgente] Detalle de agente recibido:', data);
        this.detalleAgente = data;
        marcarCompletado('DetalleAgente');
      },
      error: (err) => {
        console.error('[DetalleAgente] Error al cargar detalle de agente:', err);
        this.error = 'No se pudo cargar el detalle del agente';
        marcarCompletado('DetalleAgente (con error)');
      }
    });

    console.log('[DetalleAgente] Llamando a obtenerRoiPorHipotesis...');
    this.roiService.obtenerRoiPorHipotesis(this.agenteId, this.hipotesisActual).subscribe({
      next: (data) => {
        console.log('[DetalleAgente] ROI recibido:', data);
        this.roiData = data;
        marcarCompletado('ROI');
      },
      error: (err) => {
        console.error('[DetalleAgente] Error al cargar ROI:', err);
        marcarCompletado('ROI (con error)');
      }
    });

    console.log('[DetalleAgente] Llamando a obtenerCuentasPorAgente...');
    this.cuentasService.obtenerCuentasPorAgente(this.agenteId, this.hipotesisActual).subscribe({
      next: (data) => {
        console.log('[DetalleAgente] Cuentas recibidas:', data);
        this.cuentasData = data;
        marcarCompletado('Cuentas');
      },
      error: (err) => {
        console.error('[DetalleAgente] Error al cargar cuentas:', err);
        marcarCompletado('Cuentas (con error)');
      }
    });

    console.log('[DetalleAgente] Llamando a obtenerHistorialMatrimoniosAgente...');
    this.cuentasService.obtenerHistorialMatrimoniosAgente(this.agenteId, this.hipotesisActual).subscribe({
      next: (data) => {
        console.log('[DetalleAgente] Historial matrimonios recibido:', data);
        this.historialMatrimonios = data;
        marcarCompletado('HistorialMatrimonios');
      },
      error: (err) => {
        console.error('[DetalleAgente] Error al cargar historial matrimonios:', err);
        marcarCompletado('HistorialMatrimonios (con error)');
      }
    });
  }

  cambiarHipotesis(hipotesis: 3 | 5 | 7 | 10 | 15): void {
    this.hipotesisActual = hipotesis;
    this.cargarDatos();
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }

  obtenerClaseROI(roi: number): string {
    return roi >= 0 ? 'positivo' : 'negativo';
  }

  formatearFecha(fecha: Date | string): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    // Usar UTC para evitar desfases de zona horaria
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }
}
