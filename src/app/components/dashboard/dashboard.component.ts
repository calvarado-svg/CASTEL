import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SimulacionService } from '../../services/simulacion.service';
import { Top10Service, TodosAgentesRankingResponse } from '../../services/top10.service';
import { CuentasClientesService } from '../../services/cuentas-clientes.service';
import {
  Simulacion,
  HistorialSimulacionesResponse
} from '../../models/simulacion.model';
import { Top10Response, AgenteRanking } from '../../models/top10.model';
import { ResumenCuentas, CuentasPorAgenteResponse } from '../../models/cuenta-cliente.model';
import { timeout, catchError, of } from 'rxjs';
import { RankingEvolutionChartComponent } from '../ranking-evolution-chart/ranking-evolution-chart.component';
import { DistribucionRoiChartComponent } from '../distribucion-roi-chart/distribucion-roi-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RankingEvolutionChartComponent, DistribucionRoiChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  // Datos principales
  ultimaSimulacion: Simulacion | null = null;
  top10: AgenteRanking[] = [];
  siguientes10: AgenteRanking[] = [];
  resumenCuentas: ResumenCuentas | null = null;

  // Estados de carga
  cargando = true;
  error: string | null = null;
  top10Cargando = false;
  top10Error: string | null = null;

  // Hipótesis actual (se obtendrá de la última simulación)
  hipotesisActual: 3 | 5 | 7 | 10 | 15 = 5;

  // Cuentas por agente
  cuentasPorAgente: Map<string, CuentasPorAgenteResponse> = new Map();
  cargandoCuentas: Map<string, boolean> = new Map();
  errorCuentas: Map<string, string> = new Map();

  constructor(
    private simulacionService: SimulacionService,
    private top10Service: Top10Service,
    private cuentasService: CuentasClientesService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga todos los datos del dashboard en paralelo
   */
  cargarDatos(): void {
    this.cargando = true;
    this.error = null;
    this.top10Cargando = true;
    this.top10Error = null;

    let contadorCompletado = 0;
    const totalPeticiones = 2;

    const marcarCompletado = () => {
      contadorCompletado++;
      console.log(`Completado: ${contadorCompletado}/${totalPeticiones}`);
      if (contadorCompletado >= totalPeticiones) {
        this.cargando = false;
        console.log('Estado cargando establecido a FALSE');
        console.log('Datos disponibles:', {
          ultimaSimulacion: this.ultimaSimulacion?.simulacionId,
          resumenCuentas: this.resumenCuentas?.resumen.totalCuentas,
          top10: this.top10.length
        });
        console.log('Estado error:', this.error);
        this.cdr.detectChanges();
        console.log('Deteccion de cambios forzada');

        // Debug: verificar elementos en el DOM
        setTimeout(() => {
          const loading = document.querySelector('.loading');
          const content = document.querySelector('.dashboard-content');
          const error = document.querySelector('.error-message');
          console.log('DEBUG DOM:');
          console.log('- Elemento .loading:', loading ? 'PRESENTE' : 'AUSENTE');
          console.log('- Elemento .dashboard-content:', content ? 'PRESENTE' : 'AUSENTE');
          console.log('- Elemento .error-message:', error ? 'PRESENTE' : 'AUSENTE');
          console.log('- Estado this.cargando:', this.cargando);
          console.log('- Estado this.error:', this.error);
        }, 100);
      }
    };

    // Cargar historial de simulaciones
    this.simulacionService.obtenerHistorial(5, 0).subscribe({
      next: (historial) => {
        if (historial.simulaciones && historial.simulaciones.length > 0) {
          this.ultimaSimulacion = historial.simulaciones[0];
          // Actualizar la hipótesis actual con la de la última simulación
          this.hipotesisActual = this.ultimaSimulacion.hipotesis;
          console.log('Hipótesis establecida desde última simulación:', this.hipotesisActual);
        }
        console.log('Historial cargado:', historial);
        marcarCompletado();
      },
      error: (err) => {
        console.error('Error al cargar historial:', err);
        marcarCompletado();
      }
    });

    // Cargar resumen de cuentas
    this.cuentasService.obtenerResumen(this.hipotesisActual).subscribe({
      next: (resumen) => {
        this.resumenCuentas = resumen;
        console.log('Resumen de cuentas cargado:', resumen);
        marcarCompletado();
      },
      error: (err) => {
        console.error('Error al cargar resumen de cuentas:', err);
        marcarCompletado();
      }
    });

    // Cargar TOP10 usando obtenerTodosAgentes (rapido, lee de BD)
    // Los datos YA vienen ordenados y clasificados desde la BD
    console.log('Iniciando carga de TOP10...');
    this.top10Service.obtenerTodosAgentes(this.hipotesisActual)
      .pipe(
        timeout(60000),
        catchError((err) => {
          console.error('Error al cargar TOP10:', err);
          if (err.name === 'TimeoutError') {
            this.top10Error = 'El TOP10 esta tardando demasiado. Intente recargar mas tarde.';
          } else {
            this.top10Error = 'No se pudo cargar el TOP10. Verifique que existan datos de simulacion.';
          }
          this.top10Cargando = false;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe({
        next: (response: TodosAgentesRankingResponse | null) => {
          if (response && response.agentes && response.agentes.length > 0) {
            console.log('Total agentes recibidos:', response.agentes.length);

            // =====================================================
            // MISMA LOGICA EXACTA QUE EL TOOLTIP (getTop10DelPeriodo)
            // Ver ranking-evolution-chart.component.ts lineas 961-985
            // =====================================================

            // 1. Encontrar la fecha del ULTIMO PERIODO (igual que periodoSeleccionado en el grafico)
            // El grafico usa: primerAgente.periodos[primerAgente.periodos.length - 1].fechaFin
            let fechaUltimoPeriodo = '';
            if (response.agentes.length > 0 && response.agentes[0].periodos.length > 0) {
              fechaUltimoPeriodo = response.agentes[0].periodos[response.agentes[0].periodos.length - 1].fechaFin;
            }

            console.log('Fecha ultimo periodo (periodoSeleccionado):', fechaUltimoPeriodo);

            // 2. Crear array de agentes con su ROI del periodo seleccionado
            // EXACTAMENTE como hace getTop10DelPeriodo:
            // const periodo = agente.periodos.find(p => p.fechaFin === this.periodoSeleccionado);
            // roiHipotesis: periodo?.roiHipotesis || 0
            const agentesConRoi = response.agentes.map(agente => {
              const periodo = agente.periodos.find(p => p.fechaFin === fechaUltimoPeriodo);
              return {
                posicion: 0,
                agente_id: agente.agente_id,
                userId: agente.userId,
                symbol: agente.symbol,
                roiHipotesis: periodo?.roiHipotesis || 0, // IGUAL que el tooltip: || 0
                roiUltimoPeriodo: periodo?.roiHipotesis || 0,
                roiPromedio: agente.periodos.length > 0
                  ? agente.periodos.reduce((sum, p) => sum + p.roiHipotesis, 0) / agente.periodos.length
                  : 0,
                estadoAgente: agente.estadoAgente,
                periodos: agente.periodos.length,
                cuentasAsignadas: 0
              } as AgenteRanking;
            });

            // 3. Ordenar por ROI descendente
            // NOTA: El endpoint ya devuelve solo agentes que cumplieron las reglas
            // El estadoAgente aquí indica si está en TOP 10 (ACTIVO) o siguientes (EN_ESPERA)
            const agentesOrdenados = agentesConRoi
              .sort((a, b) => b.roiHipotesis - a.roiHipotesis);

            // 4. Asignar posiciones
            this.top10 = agentesOrdenados.slice(0, 10).map((a, i) => ({
              ...a,
              posicion: i + 1,
              estadoAgente: 'ACTIVO' as const
            }));

            this.siguientes10 = agentesOrdenados.slice(10, 20).map((a, i) => ({
              ...a,
              posicion: i + 11,
              estadoAgente: 'EN_ESPERA' as const
            }));

            console.log('TOP10 calculado (EXACTO como tooltip):', this.top10.map(a => `#${a.posicion} ${a.userId} (${a.roiHipotesis.toFixed(2)}%)`));
            console.log('Siguientes10:', this.siguientes10.map(a => `#${a.posicion} ${a.userId} (${a.roiHipotesis.toFixed(2)}%)`));
          } else {
            this.top10 = [];
            this.siguientes10 = [];
          }
          this.top10Cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Formatea un número como moneda
   */
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  }

  /**
   * Formatea un porcentaje
   */
  formatearPorcentaje(valor: number | undefined): string {
    if (valor === undefined || valor === null) {
      return '0.00%';
    }
    return `${valor.toFixed(2)}%`;
  }

  /**
   * Obtiene la clase CSS según el ROI (positivo/negativo)
   */
  obtenerClaseROI(roi: number): string {
    return roi >= 0 ? 'positivo' : 'negativo';
  }

  /**
   * Formatea una fecha (usa UTC para evitar desfases de zona horaria)
   */
  formatearFecha(fecha: Date | string): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  /**
   * Obtiene el agente con mejor ROI del TOP10
   */
  get mejorAgente(): AgenteRanking | null {
    if (this.top10.length === 0) return null;
    return this.top10[0]; // Ya viene ordenado de mayor a menor
  }

  /**
   * Obtiene el agente con peor ROI del TOP10
   */
  get peorAgente(): AgenteRanking | null {
    if (this.top10.length === 0) return null;
    return this.top10[this.top10.length - 1]; // Último del TOP10
  }

  /**
   * Calcula el ROI promedio del TOP10
   */
  get roiPromedio(): number {
    if (this.top10.length === 0) return 0;
    const suma = this.top10.reduce((acc, agente) => acc + agente.roiHipotesis, 0);
    return suma / this.top10.length;
  }

  /**
   * Obtiene el porcentaje de la barra para el gráfico
   */
  obtenerPorcentajeBarra(roi: number): number {
    if (this.top10.length === 0) return 0;
    const maxRoi = Math.max(...this.top10.map(a => a.roiHipotesis));
    const minRoi = Math.min(...this.top10.map(a => a.roiHipotesis));
    const rango = maxRoi - minRoi;

    if (rango === 0) return 100;

    return ((roi - minRoi) / rango) * 100;
  }

  // === DISTRIBUCIÓN DE CUENTAS POR AGENTE ===

  ordenDistribucion: 'ranking' | 'cuentas' | 'roi' | 'balance' = 'ranking';
  agenteSeleccionado: string | null = null;

  /**
   * Obtiene la distribución ordenada según el criterio seleccionado
   */
  get distribucionOrdenada() {
    if (!this.resumenCuentas) return [];

    const distribucion = [...this.resumenCuentas.resumen.distribucionPorAgente];

    switch (this.ordenDistribucion) {
      case 'ranking':
        // Ordenar según el ranking del TOP 10
        return distribucion.sort((a, b) => {
          const posA = this.obtenerPosicionEnRanking(a.agente_id);
          const posB = this.obtenerPosicionEnRanking(b.agente_id);
          return posA - posB; // Menor posición primero (#1, #2, etc.)
        });
      case 'roi':
        return distribucion.sort((a, b) => b.roiPromedioAgente - a.roiPromedioAgente);
      case 'balance':
        return distribucion.sort((a, b) => b.balanceTotalCuentas - a.balanceTotalCuentas);
      case 'cuentas':
      default:
        return distribucion.sort((a, b) => b.cuentasAsignadas - a.cuentasAsignadas);
    }
  }

  /**
   * Obtiene la posición de un agente en el ranking TOP 10/20
   * Retorna un número alto si no está en el ranking
   */
  obtenerPosicionEnRanking(agenteId: string): number {
    // Buscar en TOP 10
    const enTop10 = this.top10.find(a => a.agente_id === agenteId);
    if (enTop10) return enTop10.posicion;

    // Buscar en siguientes 10
    const enSiguientes10 = this.siguientes10.find(a => a.agente_id === agenteId);
    if (enSiguientes10) return enSiguientes10.posicion;

    // Si no está en ningún ranking, poner al final
    return 999;
  }

  /**
   * Cambia el criterio de ordenamiento
   */
  cambiarOrden(orden: 'ranking' | 'cuentas' | 'roi' | 'balance'): void {
    this.ordenDistribucion = orden;
  }

  /**
   * Selecciona un agente para ver sus cuentas
   */
  seleccionarAgente(agenteId: string): void {
    // Si ya está seleccionado, colapsar
    if (this.agenteSeleccionado === agenteId) {
      this.agenteSeleccionado = null;
      return;
    }

    // Expandir nuevo agente
    this.agenteSeleccionado = agenteId;

    // Cargar cuentas si no están cargadas
    if (!this.cuentasPorAgente.has(agenteId)) {
      this.cargarCuentasDeAgente(agenteId);
    }
  }

  /**
   * Carga las cuentas asignadas a un agente específico
   */
  cargarCuentasDeAgente(agenteId: string): void {
    this.cargandoCuentas.set(agenteId, true);
    this.errorCuentas.delete(agenteId);

    this.cuentasService.obtenerCuentasPorAgente(agenteId, this.hipotesisActual)
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error(`Error al cargar cuentas del agente ${agenteId}:`, err);
          this.errorCuentas.set(agenteId, 'No se pudieron cargar las cuentas. Intente nuevamente.');
          this.cargandoCuentas.set(agenteId, false);
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.cuentasPorAgente.set(agenteId, response);
            console.log(`Cuentas del agente ${agenteId}:`, response);
          }
          this.cargandoCuentas.set(agenteId, false);
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Obtiene las cuentas de un agente
   */
  obtenerCuentasAgente(agenteId: string): CuentasPorAgenteResponse | null {
    return this.cuentasPorAgente.get(agenteId) || null;
  }

  /**
   * Verifica si está cargando las cuentas de un agente
   */
  estaCargandoCuentas(agenteId: string): boolean {
    return this.cargandoCuentas.get(agenteId) || false;
  }

  /**
   * Obtiene el error de carga de cuentas de un agente
   */
  obtenerErrorCuentas(agenteId: string): string | null {
    return this.errorCuentas.get(agenteId) || null;
  }

  /**
   * Calcula el porcentaje de cuentas que tiene un agente
   */
  calcularPorcentajeCuentas(cuentasAgente: number): number {
    if (!this.resumenCuentas) return 0;
    return (cuentasAgente / this.resumenCuentas.resumen.totalCuentas) * 100;
  }

  /**
   * Calcula el porcentaje del balance total que maneja un agente
   */
  calcularPorcentajeBalance(balanceAgente: number): number {
    if (!this.resumenCuentas) return 0;
    return (balanceAgente / this.resumenCuentas.resumen.balanceActualTotal) * 100;
  }

  /**
   * Obtiene los top 5 agentes ordenados por balance
   */
  get top5PorBalance() {
    if (!this.resumenCuentas) return [];
    return [...this.resumenCuentas.resumen.distribucionPorAgente]
      .sort((a, b) => b.balanceTotalCuentas - a.balanceTotalCuentas)
      .slice(0, 5);
  }

  /**
   * Navega al detalle de una cuenta
   */
  verDetalleCuenta(event: Event, cuentaId: string): void {
    console.log('[Dashboard] verDetalleCuenta - cuentaId:', cuentaId);

    // Prevenir que el evento se propague al tr padre
    event.stopPropagation();

    // Navegar al detalle de la cuenta
    console.log('[Dashboard] Navegando a:', ['/cuenta', cuentaId]);
    this.router.navigate(['/cuenta', cuentaId]).then(success => {
      console.log('[Dashboard] Navegación completada:', success);
    }).catch(error => {
      console.error('[Dashboard] Error en navegación:', error);
    });
  }
}
