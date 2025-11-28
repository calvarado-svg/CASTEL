export interface Simulacion {
  _id?: string;
  simulacionId: string;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  diasConfiguracion: number;
  fechaInicio: Date | string;
  fechaFin: Date | string;
  estado: 'CONFIGURANDO' | 'EN_PROGRESO' | 'COMPLETADA' | 'CANCELADA' | 'ERROR';

  // Progreso en tiempo real
  diaActual: number;
  porcentajeCompletado: number;

  // Resultados finales
  resultadoFinal?: ResultadoFinal;
  estadisticas?: EstadisticasSimulacion;
  metricasPorDia: MetricaDia[];

  // Metadata
  fechaCreacion: Date | string;
  fechaInicioEjecucion?: Date | string;
  fechaFinalizacion?: Date | string;
  tiempoEjecucion?: number; // segundos

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ResultadoFinal {
  balanceInicial: number;
  balanceFinal: number;
  roiGlobal: number;
  gananciaTotal: number;
  totalDivorcios: number;
  cambiosEnTop10: number;
  diasSimulados: number;
}

export interface EstadisticasSimulacion {
  mejorDia: {
    dia: number;
    fecha: Date | string;
    roiDelDia: number;
    ganancia: number;
  };
  peorDia: {
    dia: number;
    fecha: Date | string;
    roiDelDia: number;
    perdida: number;
  };
}

export interface MetricaDia {
  dia: number;
  fecha: Date | string;
  divorcios: number;
  balanceTotal: number;
  roiDelDia: number;
  agentesExpulsados: string[];
  agentesNuevos: string[];
}

// Request para ejecutar simulación
export interface EjecutarSimulacionRequest {
  hipotesis: 3 | 5 | 7 | 10 | 15;
  dias: number;
  fechaInicio: string; // "YYYY-MM-DD"
  fechaFin: string;    // "YYYY-MM-DD"
  // NOTA: La limpieza de datos anteriores es ahora AUTOMÁTICA al iniciar cualquier simulación
}

// Response de ejecutar simulación
export interface EjecutarSimulacionResponse {
  success: boolean;
  simulacionId: string;
  mensaje: string;
  diasSimulados: number;
  hipotesis: number;
  fechas: {
    inicio: string;
    fin: string;
  };
  resumenFinal: {
    balanceInicial: number;
    balanceFinal: number;
    roiGlobal: number;
    gananciaTotal: number;
    distribucionPorAgente: any[];
  };
  estadisticas: any;
  top10Final: any[];
  historialCambios: any[];
  tiempoEjecucion: string;
}

// Response de historial
export interface HistorialSimulacionesResponse {
  success: boolean;
  simulaciones: Simulacion[];
  total: number;
  limit: number;
  offset: number;
}

// Response de estado
export interface EstadoSimulacionResponse {
  success: boolean;
  simulacion: Simulacion;
}
