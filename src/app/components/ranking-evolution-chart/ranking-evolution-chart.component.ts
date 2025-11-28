import { Component, OnInit, Input, OnChanges, SimpleChanges, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'chart.js';
import { Top10Service, TodosAgentesRankingResponse } from '../../services/top10.service';
import { RoiService, TodosAgentesRoiDiarioResponse, RoiGeneralResponse } from '../../services/roi.service';

// Registrar el plugin de zoom
Chart.register(zoomPlugin);

interface DatosLineaRoi {
  agente_id: string;
  userId: string;
  symbol: string;
  posicion: number;
  estadoAgente: 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO';
  data: { x: number; y: number }[];
  dataPorPeriodo: { x: number; y: number }[]; // Datos con puntos intermedios por periodo
  color: string;
}

@Component({
  selector: 'app-ranking-evolution-chart',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './ranking-evolution-chart.component.html',
  styleUrl: './ranking-evolution-chart.component.scss'
})
export class RankingEvolutionChartComponent implements OnInit, OnChanges {
  @Input() hipotesis: 3 | 5 | 7 | 10 | 15 = 5;
  @Input() fechaInicio?: string;
  @Input() fechaFin?: string;
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  cargando = true;
  error: string | null = null;

  // Filtros
  mostrarSoloTop10 = true;
  mostrarExpulsados = false; // Por defecto no mostrar expulsados
  tipoVista: 'hipotesis' | 'periodo' | 'general' = 'hipotesis'; // Nueva opción: general
  usarFiltroFechas = false; // Por defecto mostrar todos los datos
  todosLosDatos: DatosLineaRoi[] = [];

  // Para ROI General
  roiGeneralData: RoiGeneralResponse | null = null;
  diaSeleccionado: string | null = null;

  // Para vista de hipótesis - almacenar datos originales
  rankingHipotesisData: TodosAgentesRankingResponse | null = null;
  periodoSeleccionado: string | null = null;

  public lineChartData: ChartConfiguration<'line'>['data'] = {
    datasets: []
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event, activeElements) => {
      if (activeElements.length > 0) {
        const elementIndex = activeElements[0].index;

        if (this.tipoVista === 'general') {
          // Vista ROI General: mostrar TOP 10 del día
          if (this.roiGeneralData && this.roiGeneralData.datos[elementIndex]) {
            this.diaSeleccionado = this.roiGeneralData.datos[elementIndex].fecha;
            this.cdr.detectChanges();
          }
        } else if (this.tipoVista === 'hipotesis') {
          // Vista por Hipótesis: mostrar TOP 10 del periodo
          if (this.rankingHipotesisData && this.rankingHipotesisData.agentes.length > 0) {
            const primerAgente = this.rankingHipotesisData.agentes[0];
            if (primerAgente.periodos[elementIndex]) {
              this.periodoSeleccionado = primerAgente.periodos[elementIndex].fechaFin;
              this.cdr.detectChanges();
            }
          }
        }
      }
    },
    elements: {
      line: {
        tension: 0.3,
        borderWidth: 2
      },
      point: {
        radius: 4,
        hitRadius: 25,
        hoverRadius: 7,
        hoverBorderWidth: 3
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd'
          }
        },
        title: {
          display: true,
          text: 'Fecha (Dias de Simulacion)',
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#a1a1aa' // Color texto secundario CXP
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#a1a1aa' // Color texto secundario CXP
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)' // Grid color sutil
        }
      },
      y: {
        title: {
          display: true,
          text: 'ROI (%)',
          font: {
            size: 14,
            weight: 'bold'
          },
          color: '#a1a1aa' // Color texto secundario CXP
        },
        ticks: {
          font: {
            size: 12
          },
          color: '#a1a1aa', // Color texto secundario CXP
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(99, 102, 241, 0.1)' // Grid color sutil
        },
        beginAtZero: false
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12
          },
          boxWidth: 12,
          boxHeight: 12,
          color: '#a1a1aa' // Color texto secundario CXP
        }
      },
      tooltip: {
        mode: 'point',
        intersect: true,
        backgroundColor: 'rgba(18, 18, 42, 0.95)', // Fondo oscuro CXP
        titleColor: '#ffffff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        bodyFont: {
          size: 13
        },
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        padding: 12,
        callbacks: {
          title: (context) => {
            const x = context[0].parsed.x;
            if (x === null) return '';
            const fecha = new Date(x);
            return fecha.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'UTC'
            });
          },
          label: (context) => {
            const roi = context.parsed.y;
            if (roi === null) return '';

            // Vista ROI General: mostrar el nombre de la línea
            if (this.tipoVista === 'general') {
              return `${context.dataset.label}: ${roi.toFixed(2)}%`;
            }

            // Otras vistas
            const labelTipo = this.tipoVista === 'hipotesis' ? 'ROI Hipótesis' : 'ROI Acumulado Sumado';
            return `${labelTipo}: ${roi.toFixed(2)}%`;
          },
          afterLabel: (context) => {
            const dataset = context.dataset as any;
            const dataIndex = context.dataIndex;
            const dataPoint = dataset.data[dataIndex] as any;

            const info: string[] = [];

            // Calcular el cambio respecto al punto anterior
            if (dataIndex > 0) {
              const prevPoint = dataset.data[dataIndex - 1] as any;
              const cambio = dataPoint.y - prevPoint.y;
              const simbolo = cambio >= 0 ? '▲' : '▼';
              info.push(`Cambio: ${simbolo} ${cambio.toFixed(2)}%`);
            }

            return info;
          },
          afterBody: (context) => {
            if (context.length === 0) return [];

            const dataIndex = context[0].dataIndex;
            const info: string[] = [];

            // Si es vista ROI General, mostrar el TOP 10 en el tooltip (solo una vez)
            if (this.tipoVista === 'general' && this.roiGeneralData && this.roiGeneralData.datos[dataIndex]) {
              const diaData = this.roiGeneralData.datos[dataIndex];
              if (diaData.top10 && diaData.top10.length > 0) {
                info.push('');
                info.push('TOP 10 del dia:');
                diaData.top10.forEach((agente, idx) => {
                  info.push(`#${idx + 1} ${agente.userId} (${agente.symbol}): ${agente.roiHipotesis.toFixed(2)}%`);
                });
              }
            }

            // Si es vista por Hipotesis, mostrar el TOP 10 del periodo en el tooltip (solo una vez)
            if (this.tipoVista === 'hipotesis' && this.rankingHipotesisData) {
              const top10Periodo = this.getTop10PorDataIndex(dataIndex);
              if (top10Periodo.length > 0) {
                info.push('');
                info.push('TOP 10 del periodo:');
                top10Periodo.forEach((agente, idx) => {
                  info.push(`#${idx + 1} ${agente.userId} (${agente.symbol}): ${agente.roiHipotesis.toFixed(2)}%`);
                });
              }
            }

            return info;
          },
          footer: (context) => {
            if (context.length === 0) return '';

            // En vista ROI General no mostrar footer adicional
            if (this.tipoVista === 'general') {
              return '';
            }

            const dataset = context[0].dataset as any;
            return `\n${dataset.label}`;
          }
        }
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1
          },
          pinch: {
            enabled: true
          },
          mode: 'x'
        },
        pan: {
          enabled: true,
          mode: 'x'
        },
        limits: {
          x: {min: 'original', max: 'original'}
        }
      }
    }
  };

  public lineChartType: ChartType = 'line';

  private colores = [
    '#FF6384', // Rosa fuerte
    '#36A2EB', // Azul
    '#FFCE56', // Amarillo
    '#4BC0C0', // Turquesa
    '#9966FF', // Morado
    '#FF9F40', // Naranja
    '#FF6B9D', // Rosa claro
    '#4ECDC4', // Turquesa claro
    '#45B7D1', // Azul claro
    '#96CEB4', // Verde menta
    '#FFEAA7', // Amarillo pastel
    '#DFE6E9', // Gris claro
    '#74B9FF', // Azul cielo
    '#A29BFE', // Morado claro
    '#FD79A8', // Rosa pastel
    '#FDCB6E', // Amarillo mostaza
    '#6C5CE7', // Morado oscuro
    '#00B894', // Verde
    '#00CEC9', // Cyan
    '#E17055'  // Naranja oscuro
  ];

  constructor(
    private top10Service: Top10Service,
    private roiService: RoiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['hipotesis'] && !changes['hipotesis'].firstChange) ||
        (changes['fechaInicio'] && !changes['fechaInicio'].firstChange) ||
        (changes['fechaFin'] && !changes['fechaFin'].firstChange)) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = null;

    console.log('[RANKING_CHART] Iniciando carga de datos ROI...');
    console.log('[RANKING_CHART] Hipotesis:', this.hipotesis);

    this.top10Service.obtenerTodosAgentes(this.hipotesis, this.fechaInicio, this.fechaFin).subscribe({
      next: (response) => {
        console.log('[RANKING_CHART] Respuesta recibida:', response);
        console.log('[RANKING_CHART] Total agentes:', response.totalAgentes);

        if (!response.agentes || response.agentes.length === 0) {
          console.log('[RANKING_CHART] No hay agentes para procesar');
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        try {
          this.procesarDatosRoi(response);
          console.log('[RANKING_CHART] Datos procesados correctamente');
          this.cargando = false;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('[RANKING_CHART] Error al procesar datos:', error);
          this.error = 'Error al procesar los datos del grafico';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[RANKING_CHART] Error en la peticion:', err);
        this.error = 'No se pudieron cargar los datos del grafico';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarDatosRoiDiario(): void {
    this.cargando = true;
    this.error = null;

    console.log('[RANKING_CHART] Iniciando carga de datos ROI DIARIO...');
    console.log('[RANKING_CHART] Hipotesis:', this.hipotesis);
    console.log('[RANKING_CHART] Usar filtro de fechas:', this.usarFiltroFechas);

    // Decidir qué endpoint usar según el filtro
    const observable = this.usarFiltroFechas && this.fechaInicio && this.fechaFin
      ? this.roiService.obtenerTodosAgentesRoiDiarioFiltrado(this.hipotesis, this.fechaInicio, this.fechaFin)
      : this.roiService.obtenerTodosAgentesRoiDiario(this.hipotesis, this.fechaInicio, this.fechaFin);

    observable.subscribe({
      next: (response) => {
        console.log('[RANKING_CHART] Respuesta recibida (ROI Diario):', response);
        console.log('[RANKING_CHART] Total agentes:', response.totalAgentes);

        if (!response.agentes || response.agentes.length === 0) {
          console.log('[RANKING_CHART] No hay agentes para procesar');
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        try {
          this.procesarDatosRoiDiario(response);
          console.log('[RANKING_CHART] Datos ROI Diario procesados correctamente');
          this.cargando = false;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('[RANKING_CHART] Error al procesar datos ROI Diario:', error);
          this.error = 'Error al procesar los datos del grafico';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[RANKING_CHART] Error en la peticion ROI Diario:', err);
        this.error = 'No se pudieron cargar los datos del grafico';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarDatosRoiGeneral(): void {
    this.cargando = true;
    this.error = null;

    console.log('[RANKING_CHART] Iniciando carga de datos ROI GENERAL...');
    console.log('[RANKING_CHART] Hipotesis:', this.hipotesis);

    this.roiService.obtenerRoiGeneral(this.hipotesis).subscribe({
      next: (response) => {
        console.log('[RANKING_CHART] Respuesta recibida (ROI General):', response);
        console.log('[RANKING_CHART] Total días:', response.datos.length);

        if (!response.datos || response.datos.length === 0) {
          console.log('[RANKING_CHART] No hay datos de ROI General para procesar');
          this.cargando = false;
          this.cdr.detectChanges();
          return;
        }

        try {
          this.procesarDatosRoiGeneral(response);
          console.log('[RANKING_CHART] Datos ROI General procesados correctamente');
          this.cargando = false;
          this.cdr.detectChanges();
        } catch (error) {
          console.error('[RANKING_CHART] Error al procesar datos ROI General:', error);
          this.error = 'Error al procesar los datos del grafico';
          this.cargando = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('[RANKING_CHART] Error en la peticion ROI General:', err);
        this.error = 'No se pudieron cargar los datos del grafico';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  private procesarDatosRoi(response: TodosAgentesRankingResponse): void {
    console.log('[RANKING_CHART] Procesando datos de ROI...');

    // Guardar los datos completos para mostrar el TOP 10 por periodo
    this.rankingHipotesisData = response;

    // Auto-seleccionar el último periodo para mostrar su TOP 10
    let fechaUltimoPeriodo = '';
    if (response.agentes.length > 0 && response.agentes[0].periodos.length > 0) {
      const ultimoPeriodo = response.agentes[0].periodos[response.agentes[0].periodos.length - 1];
      this.periodoSeleccionado = ultimoPeriodo.fechaFin;
      fechaUltimoPeriodo = ultimoPeriodo.fechaFin;
    }

    // =====================================================
    // CALCULAR POSICIONES CORRECTAS BASADAS EN EL ULTIMO PERIODO
    // NOTA: El endpoint ya devuelve solo agentes que cumplieron las reglas
    // =====================================================
    const posicionesCalculadas = new Map<string, number>();

    // Crear array con ROI del último periodo para cada agente
    const agentesConRoiUltimoPeriodo = response.agentes.map(agente => {
      const periodo = agente.periodos.find(p => p.fechaFin === fechaUltimoPeriodo);
      return {
        agente_id: agente.agente_id,
        userId: agente.userId,
        symbol: agente.symbol,
        cantPeriodos: agente.periodos.length,
        roiHipotesis: periodo?.roiHipotesis || 0
      };
    });

    // Ordenar por ROI descendente
    agentesConRoiUltimoPeriodo.sort((a, b) => b.roiHipotesis - a.roiHipotesis);

    // Asignar posiciones (1, 2, 3, ...)
    agentesConRoiUltimoPeriodo.forEach((agente, index) => {
      posicionesCalculadas.set(agente.agente_id, index + 1);
    });

    // DEBUG: Mostrar TOP 10 calculado con detalles
    console.log('[RANKING_CHART] ========== TOP 10 CALCULADO ==========');
    agentesConRoiUltimoPeriodo.slice(0, 10).forEach((agente, index) => {
      console.log(`[RANKING_CHART] #${index + 1}: ${agente.userId} (${agente.symbol}) - ROI: ${agente.roiHipotesis.toFixed(2)}% - Periodos: ${agente.cantPeriodos}`);
    });
    console.log('[RANKING_CHART] ======================================');

    const lineasPorAgente: DatosLineaRoi[] = [];
    let colorIndex = 0;

    // Calcular ROI máximo y mínimo para detectar outliers
    let todosLosRois: number[] = [];
    response.agentes.forEach(agente => {
      agente.periodos.forEach(periodo => {
        todosLosRois.push(periodo.roiHipotesis);
      });
    });

    // Calcular percentiles para filtrar outliers extremos
    todosLosRois.sort((a, b) => a - b);
    const p5 = todosLosRois[Math.floor(todosLosRois.length * 0.05)]; // Percentil 5
    const p95 = todosLosRois[Math.floor(todosLosRois.length * 0.95)]; // Percentil 95

    console.log(`[RANKING_CHART] Rango ROI: ${p5.toFixed(2)}% a ${p95.toFixed(2)}%`);

    response.agentes.forEach(agente => {
      // Obtener la posición calculada de este agente PRIMERO
      const posicionDeEsteAgente = posicionesCalculadas.get(agente.agente_id) || 999;
      const esTop10 = posicionDeEsteAgente >= 1 && posicionDeEsteAgente <= 10;

      // DEBUG: Siempre mostrar info de agentes TOP 10
      if (esTop10) {
        console.log(`[RANKING_CHART] >>> Analizando TOP10 #${posicionDeEsteAgente}: ${agente.userId} (${agente.symbol}) - Periodos: ${agente.periodos.length}, Estado: ${agente.estadoAgente}`);
      }

      if (agente.periodos.length === 0) {
        if (esTop10) {
          console.log(`[RANKING_CHART] XXX DESCARTADO #${posicionDeEsteAgente} ${agente.userId}: SIN PERIODOS`);
        }
        return;
      }

      // Filtrar agentes con ROI extremos (outliers) - PERO NUNCA FILTRAR TOP 10
      const maxRoiAgente = Math.max(...agente.periodos.map(p => Math.abs(p.roiHipotesis)));
      if (maxRoiAgente > 1000 && !esTop10) { // Filtrar solo si NO es TOP 10
        console.log(`[RANKING_CHART] Filtrando outlier: ${agente.userId} (${agente.symbol}) - Max ROI: ${maxRoiAgente}%`);
        return;
      }

      // DEBUG: Log para agentes TOP 10 que SÍ serán procesados
      if (esTop10) {
        console.log(`[RANKING_CHART] +++ PROCESANDO TOP10 #${posicionDeEsteAgente}: ${agente.userId} - Periodos: ${agente.periodos.length}`);
      }

      const datos: { x: number; y: number }[] = [];
      const datosPorPeriodo: { x: number; y: number }[] = [];

      let roiAcumulado = 0;

      agente.periodos.forEach((periodo, index) => {
        const fechaInicio = new Date(periodo.fechaInicio);
        const fechaFin = new Date(periodo.fechaFin);

        // DEBUG: Log para verificar datos del agente GU8
        if (agente.userId === 'futures-GU8') {
          console.log(`[DEBUG_GU8] Periodo ${index}:`, {
            fechaFin: periodo.fechaFin,
            roiHipotesis: periodo.roiHipotesis,
            closePnl: periodo.closePnlHipotesis,
            balanceInicial: periodo.balanceInicial
          });
        }

        // Para vista por hipótesis: solo el final de cada periodo
        datos.push({
          x: fechaFin.getTime(),
          y: periodo.roiHipotesis
        });

        // Para vista por periodo: agregar punto al inicio y al final
        if (index === 0) {
          // Primer periodo: agregar punto inicial en 0%
          datosPorPeriodo.push({
            x: fechaInicio.getTime(),
            y: 0
          });
        }

        // Agregar el ROI al final del periodo
        roiAcumulado = periodo.roiHipotesis;
        datosPorPeriodo.push({
          x: fechaFin.getTime(),
          y: roiAcumulado
        });
      });

      if (datos.length > 0) {
        // Usar la posición CALCULADA del último período (no la de la BD)
        const posicionCalculada = posicionesCalculadas.get(agente.agente_id) || 999;
        const esTop10Calculado = posicionCalculada >= 1 && posicionCalculada <= 10;

        let color = this.colores[colorIndex % this.colores.length];

        // Asignar colores según estado y posición CALCULADA
        if (agente.estadoAgente === 'EXPULSADO') {
          color = '#e74c3c'; // Rojo para expulsados
        } else if (esTop10Calculado) {
          color = this.colores[colorIndex % this.colores.length]; // Colores variados para TOP 10
        } else {
          color = '#95a5a6'; // Gris para resto
        }

        lineasPorAgente.push({
          agente_id: agente.agente_id,
          userId: agente.userId,
          symbol: agente.symbol,
          posicion: posicionCalculada, // Usar posición CALCULADA
          estadoAgente: agente.estadoAgente,
          data: datos,
          dataPorPeriodo: datosPorPeriodo,
          color: color
        });

        // Solo incrementar el índice de color para agentes del TOP 10 CALCULADO
        if (esTop10Calculado) {
          colorIndex++;
        }
      }
    });

    console.log('[RANKING_CHART] Lineas generadas:', lineasPorAgente.length);

    // DEBUG: Mostrar cuántos agentes tienen posición 1-10
    const top10EnLineas = lineasPorAgente.filter(l => l.posicion >= 1 && l.posicion <= 10);
    console.log('[RANKING_CHART] ========== TOP 10 EN LINEAS (agentes que SI se graficaran) ==========');
    top10EnLineas.sort((a, b) => a.posicion - b.posicion).forEach(l => {
      console.log(`[RANKING_CHART] #${l.posicion}: ${l.userId} (${l.symbol}) - Puntos: ${l.data.length}`);
    });
    console.log('[RANKING_CHART] Total agentes TOP 10 en lineas:', top10EnLineas.length);

    // DEBUG: Mostrar qué posiciones del TOP 10 FALTAN
    const posicionesEnLineas = new Set(top10EnLineas.map(l => l.posicion));
    const posicionesFaltantes = [1,2,3,4,5,6,7,8,9,10].filter(p => !posicionesEnLineas.has(p));
    if (posicionesFaltantes.length > 0) {
      console.log('[RANKING_CHART] POSICIONES FALTANTES:', posicionesFaltantes.join(', '));
    }
    console.log('[RANKING_CHART] ======================================');

    // Guardar todos los datos para filtrado
    this.todosLosDatos = lineasPorAgente;

    // Aplicar filtros
    this.aplicarFiltros();

    console.log('[RANKING_CHART] Datasets generados:', this.lineChartData.datasets.length);

    if (this.chart) {
      this.chart.update();
    }
  }

  private procesarDatosRoiDiario(response: TodosAgentesRoiDiarioResponse): void {
    console.log('[RANKING_CHART] Procesando datos de ROI DIARIO...');

    const lineasPorAgente: DatosLineaRoi[] = [];
    let colorIndex = 0;

    // Calcular ROI máximo y mínimo para detectar outliers
    let todosLosRois: number[] = [];
    response.agentes.forEach(agente => {
      agente.dias.forEach(dia => {
        todosLosRois.push(dia.roiAcumuladoSumado);
      });
    });

    // Calcular percentiles para filtrar outliers extremos
    todosLosRois.sort((a, b) => a - b);
    const p5 = todosLosRois[Math.floor(todosLosRois.length * 0.05)] || 0;
    const p95 = todosLosRois[Math.floor(todosLosRois.length * 0.95)] || 0;

    if (todosLosRois.length > 0) {
      console.log(`[RANKING_CHART] Rango ROI: ${p5.toFixed(2)}% a ${p95.toFixed(2)}%`);
    } else {
      console.log('[RANKING_CHART] No hay datos de ROI para procesar');
    }

    response.agentes.forEach(agente => {
      if (agente.dias.length === 0) {
        return;
      }

      // Filtrar agentes con ROI extremos (outliers)
      const maxRoiAgente = Math.max(...agente.dias.map(d => Math.abs(d.roiAcumuladoSumado)));
      if (maxRoiAgente > 1000) {
        console.log(`[RANKING_CHART] Filtrando outlier: ${agente.userId} (${agente.symbol}) - Max ROI: ${maxRoiAgente}%`);
        return;
      }

      const datosDiarios: { x: number; y: number }[] = [];

      agente.dias.forEach(dia => {
        const fecha = new Date(dia.fecha);
        datosDiarios.push({
          x: fecha.getTime(),
          y: dia.roiAcumuladoSumado
        });
      });

      if (datosDiarios.length > 0) {
        let color = this.colores[colorIndex % this.colores.length];

        // Asignar colores según estado y posición
        if (agente.estadoAgente === 'EXPULSADO') {
          color = '#e74c3c'; // Rojo para expulsados
        } else if (agente.posicion >= 1 && agente.posicion <= 10) {
          color = this.colores[colorIndex % this.colores.length]; // Colores variados para TOP 10
        } else {
          color = '#95a5a6'; // Gris para resto
        }

        lineasPorAgente.push({
          agente_id: agente.agente_id,
          userId: agente.userId,
          symbol: agente.symbol,
          posicion: agente.posicion,
          estadoAgente: agente.estadoAgente,
          data: datosDiarios, // Para ROI diario usamos los mismos datos
          dataPorPeriodo: datosDiarios, // En ambos casos
          color: color
        });

        // Solo incrementar el índice de color para agentes del TOP 10
        if (agente.posicion >= 1 && agente.posicion <= 10) {
          colorIndex++;
        }
      }
    });

    console.log('[RANKING_CHART] Lineas ROI DIARIO generadas:', lineasPorAgente.length);

    // Guardar todos los datos para filtrado
    this.todosLosDatos = lineasPorAgente;

    // Aplicar filtros
    this.aplicarFiltros();

    console.log('[RANKING_CHART] Datasets ROI DIARIO generados:', this.lineChartData.datasets.length);

    if (this.chart) {
      this.chart.update();
    }
  }

  private procesarDatosRoiGeneral(response: RoiGeneralResponse): void {
    console.log('[RANKING_CHART] Procesando datos de ROI GENERAL...');

    // Guardar los datos completos para mostrar el TOP 10
    this.roiGeneralData = response;

    const datosPositivos: { x: number; y: number }[] = [];
    const datosNegativos: { x: number; y: number }[] = [];
    const datosNeto: { x: number; y: number }[] = [];

    response.datos.forEach(dia => {
      const fecha = new Date(dia.fecha);

      datosPositivos.push({
        x: fecha.getTime(),
        y: dia.roiGeneralAcumulado
      });

      datosNegativos.push({
        x: fecha.getTime(),
        y: dia.roiGeneralCaidaAcumulado
      });

      // ROI Neto = suma de positivos + negativos
      datosNeto.push({
        x: fecha.getTime(),
        y: dia.roiGeneralAcumulado + dia.roiGeneralCaidaAcumulado
      });
    });

    console.log('[RANKING_CHART] Datos procesados - Positivos:', datosPositivos.length, 'Negativos:', datosNegativos.length, 'Neto:', datosNeto.length);
    console.log('[RANKING_CHART] Total días con TOP 10:', response.datos.filter(d => d.top10 && d.top10.length > 0).length);

    // Auto-seleccionar el último día para mostrar su TOP 10
    if (response.datos.length > 0) {
      this.diaSeleccionado = response.datos[response.datos.length - 1].fecha;
    }

    // Crear datasets directamente (no usar todosLosDatos ya que ROI General no filtra por agentes)
    this.lineChartData = {
      datasets: [
        {
          label: 'ROI General Acumulado (Positivo)',
          data: datosPositivos,
          borderColor: '#00B894', // Verde
          backgroundColor: '#00B89420',
          borderWidth: 4,
          fill: false,
          pointBackgroundColor: '#00B894',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#00B894',
          pointHoverBorderWidth: 3,
          spanGaps: false,
          tension: 0.3
        },
        {
          label: 'ROI General Caída (Negativo)',
          data: datosNegativos,
          borderColor: '#e74c3c', // Rojo
          backgroundColor: '#e74c3c20',
          borderWidth: 4,
          fill: false,
          pointBackgroundColor: '#e74c3c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#e74c3c',
          pointHoverBorderWidth: 3,
          spanGaps: false,
          tension: 0.3
        },
        {
          label: 'ROI Neto (Total)',
          data: datosNeto,
          borderColor: '#3498db', // Azul
          backgroundColor: '#3498db20',
          borderWidth: 4,
          fill: false,
          pointBackgroundColor: '#3498db',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#3498db',
          pointHoverBorderWidth: 3,
          spanGaps: false,
          tension: 0.3
        }
      ]
    };

    console.log('[RANKING_CHART] Datasets ROI GENERAL generados:', this.lineChartData.datasets.length);

    if (this.chart) {
      this.chart.update();
    }
  }

  aplicarFiltros(): void {
    let datosFiltrados = this.todosLosDatos;

    // Filtrar por TOP 10 primero (si está activado)
    if (this.mostrarSoloTop10) {
      datosFiltrados = datosFiltrados.filter(linea => {
        // Incluir solo los que tengan posición entre 1 y 10
        return linea.posicion >= 1 && linea.posicion <= 10;
      });
    } else {
      // Si NO estamos mostrando solo TOP 10, entonces aplicar filtro de expulsados
      // Pero si mostramos TOP 10, SIEMPRE mostrar todos los del TOP 10 sin importar si están expulsados
      if (!this.mostrarExpulsados) {
        datosFiltrados = datosFiltrados.filter(linea => linea.estadoAgente !== 'EXPULSADO');
      }
    }

    console.log(`[RANKING_CHART] Mostrando ${datosFiltrados.length} de ${this.todosLosDatos.length} agentes`);
    console.log(`[RANKING_CHART] Filtros: TOP10=${this.mostrarSoloTop10}, Expulsados=${this.mostrarExpulsados}`);

    // Generar datasets con opacidad mejorada
    this.lineChartData = {
      datasets: datosFiltrados.map(linea => {
        const esTop10 = linea.posicion > 0 && linea.posicion <= 10;
        const esTop5 = linea.posicion > 0 && linea.posicion <= 5;
        const borderWidth = esTop5 ? 4 : (esTop10 ? 3 : 2);
        const pointRadius = esTop5 ? 5 : (esTop10 ? 4 : 3);

        // Etiqueta según estado
        let label = '';
        if (linea.estadoAgente === 'EXPULSADO') {
          label = `[EXPULSADO] ${linea.userId} (${linea.symbol})`;
        } else if (esTop10) {
          label = `#${linea.posicion} (Pos. Final) - ${linea.userId} (${linea.symbol})`;
        } else {
          label = `${linea.userId} (${linea.symbol})`;
        }

        // Seleccionar los datos según el tipo de vista
        const datosAMostrar = this.tipoVista === 'periodo' ? linea.dataPorPeriodo : linea.data;

        return {
          label: label,
          data: datosAMostrar,
          borderColor: linea.color,
          backgroundColor: linea.color + '20', // Menos transparencia
          borderWidth: borderWidth,
          fill: false,
          pointBackgroundColor: linea.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: pointRadius,
          pointHoverRadius: pointRadius + 3,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: linea.color,
          pointHoverBorderWidth: 3,
          spanGaps: false,
          tension: 0.3
        };
      })
    };

    if (this.chart) {
      this.chart.update();
    }
  }

  toggleTop10(): void {
    this.mostrarSoloTop10 = !this.mostrarSoloTop10;
    this.aplicarFiltros();
  }

  toggleExpulsados(): void {
    this.mostrarExpulsados = !this.mostrarExpulsados;
    this.aplicarFiltros();
  }

  toggleFiltroFechas(usarFiltro: boolean): void {
    console.log('[RANKING_CHART] Cambiando filtro de fechas a:', usarFiltro);

    // Si no hay fechas disponibles, no permitir activar el filtro
    if (usarFiltro && (!this.fechaInicio || !this.fechaFin)) {
      console.warn('[RANKING_CHART] No se puede activar el filtro sin fechas');
      return;
    }

    this.usarFiltroFechas = usarFiltro;

    // Recargar los datos con el filtro apropiado
    this.cargarDatosRoiDiario();
  }

  resetZoom(): void {
    if (this.chart && this.chart.chart) {
      this.chart.chart.resetZoom();
    }
  }

  cambiarTipoVista(tipo: 'hipotesis' | 'periodo' | 'general'): void {
    this.tipoVista = tipo;

    // Actualizar el eje X según el tipo de vista
    if (this.lineChartOptions && this.lineChartOptions.scales && this.lineChartOptions.scales['x']) {
      const xAxis = this.lineChartOptions.scales['x'] as any;
      if (tipo === 'periodo') {
        // Vista por periodo: mostrar días más detallados
        xAxis.time = {
          unit: 'day',
          displayFormats: {
            day: 'dd MMM'
          }
        };
        xAxis.title = {
          display: true,
          text: 'Periodo de Simulacion (Dias)'
        };
      } else if (tipo === 'general') {
        // Vista ROI General: mostrar días
        xAxis.time = {
          unit: 'day',
          displayFormats: {
            day: 'dd MMM'
          }
        };
        xAxis.title = {
          display: true,
          text: 'Fecha (Dias de Simulacion)'
        };
      } else {
        // Vista por hipótesis: mantener vista original
        xAxis.time = {
          unit: 'day',
          displayFormats: {
            day: 'MMM dd'
          }
        };
        xAxis.title = {
          display: true,
          text: 'Fecha (Dias de Simulacion)'
        };
      }
    }

    // Recargar datos según el tipo de vista
    if (tipo === 'periodo') {
      this.cargarDatosRoiDiario();
    } else if (tipo === 'general') {
      this.cargarDatosRoiGeneral();
    } else {
      this.cargarDatos();
    }
  }

  getTituloVista(): string {
    if (this.tipoVista === 'hipotesis') {
      return `Evolucion de ROI - Hipotesis ${this.hipotesis}`;
    } else if (this.tipoVista === 'periodo') {
      return 'Evolucion de ROI - Por Periodo';
    } else {
      return `ROI General - Hipotesis ${this.hipotesis} - Todos los Agentes`;
    }
  }

  getTop10DelDia() {
    if (!this.roiGeneralData || !this.diaSeleccionado) {
      return [];
    }

    const diaData = this.roiGeneralData.datos.find(d => d.fecha === this.diaSeleccionado);
    return diaData?.top10 || [];
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  seleccionarPrimerDia(): void {
    if (this.roiGeneralData && this.roiGeneralData.datos.length > 0) {
      this.diaSeleccionado = this.roiGeneralData.datos[0].fecha;
    }
  }

  seleccionarUltimoDia(): void {
    if (this.roiGeneralData && this.roiGeneralData.datos.length > 0) {
      this.diaSeleccionado = this.roiGeneralData.datos[this.roiGeneralData.datos.length - 1].fecha;
    }
  }

  // Métodos para vista de Hipótesis
  getTop10DelPeriodo() {
    if (!this.rankingHipotesisData || !this.periodoSeleccionado) {
      return [];
    }

    // Crear array de agentes con su ROI del periodo seleccionado
    const agentesConRoi = this.rankingHipotesisData.agentes.map(agente => {
      const periodo = agente.periodos.find(p => p.fechaFin === this.periodoSeleccionado);
      return {
        agente_id: agente.agente_id,
        userId: agente.userId,
        symbol: agente.symbol,
        roiHipotesis: periodo?.roiHipotesis || 0
      };
    });

    // Ordenar por ROI descendente y tomar TOP 10
    return agentesConRoi
      .sort((a, b) => b.roiHipotesis - a.roiHipotesis)
      .slice(0, 10)
      .map((agente, index) => ({
        ...agente,
        posicion: index + 1
      }));
  }

  formatearPeriodo(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  seleccionarPrimerPeriodo(): void {
    if (this.rankingHipotesisData && this.rankingHipotesisData.agentes.length > 0) {
      const primerAgente = this.rankingHipotesisData.agentes[0];
      if (primerAgente.periodos.length > 0) {
        this.periodoSeleccionado = primerAgente.periodos[0].fechaFin;
      }
    }
  }

  seleccionarUltimoPeriodo(): void {
    if (this.rankingHipotesisData && this.rankingHipotesisData.agentes.length > 0) {
      const primerAgente = this.rankingHipotesisData.agentes[0];
      if (primerAgente.periodos.length > 0) {
        this.periodoSeleccionado = primerAgente.periodos[primerAgente.periodos.length - 1].fechaFin;
      }
    }
  }

  getTop10PorDataIndex(dataIndex: number) {
    if (!this.rankingHipotesisData || this.rankingHipotesisData.agentes.length === 0) {
      return [];
    }

    // Crear array de agentes con su ROI del periodo correspondiente al dataIndex
    const agentesConRoi = this.rankingHipotesisData.agentes.map(agente => {
      const periodo = agente.periodos[dataIndex];
      return {
        agente_id: agente.agente_id,
        userId: agente.userId,
        symbol: agente.symbol,
        roiHipotesis: periodo?.roiHipotesis || 0
      };
    });

    // Ordenar por ROI descendente y tomar TOP 10
    return agentesConRoi
      .sort((a, b) => b.roiHipotesis - a.roiHipotesis)
      .slice(0, 10)
      .map((agente, index) => ({
        ...agente,
        posicion: index + 1
      }));
  }
}
