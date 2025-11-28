/**
 * Representa la actividad de un agente en un día específico
 */
export interface DiaAgente {
  fecha: string; // ISO string
  tieneTrades: boolean;
  cantidadTrades: number;
  pnlTotal: number;
  esPositivo: boolean;
  balanceInicial: number;
  balanceFinal: number;
  roiDia: number;
  estadoAgente: 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO';
  estaEnTop10: boolean;
  posicionRanking?: number;
  eventoEspecial?: 'INGRESO_TOP10' | 'EXPULSION' | 'REINGRESO' | 'CAMBIO_POSICION';
}

/**
 * Resumen estadístico del timeline
 */
export interface ResumenTimeline {
  totalDias: number;
  diasConTrades: number;
  diasSinTrades: number;
  diasPositivos: number;
  diasNegativos: number;
  pnlAcumulado: number;
  mejorDia: {
    fecha: string;
    pnl: number;
    roi: number;
  };
  peorDia: {
    fecha: string;
    pnl: number;
    roi: number;
  };
}

/**
 * Timeline completo de un agente
 */
export interface TimelineAgente {
  agente_id: string;
  userId: string;
  symbol: string;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  fechaInicio: string;
  fechaFin: string;
  diasSimulados: DiaAgente[];
  resumen: ResumenTimeline;
}

/**
 * Resumen de un agente en el timeline general
 */
export interface AgenteResumen {
  agente_id: string;
  userId: string;
  symbol: string;
  diasConTrades: number;
  diasSinTrades: number;
  pnlAcumulado: number;
}

/**
 * Timeline general (vista agregada)
 */
export interface TimelineGeneral {
  hipotesis: 3 | 5 | 7 | 10 | 15;
  fechaInicio: string;
  fechaFin: string;
  totalDias: number;
  totalAgentes: number;
  agentes: AgenteResumen[];
}

/**
 * Response para obtener timeline de un agente
 */
export interface TimelineAgenteResponse {
  success: boolean;
  timeline: TimelineAgente | null;
  message?: string;
}

/**
 * Response para obtener timeline general
 */
export interface TimelineGeneralResponse {
  success: boolean;
  timeline: TimelineGeneral | null;
  message?: string;
}

/**
 * Response para obtener múltiples timelines
 */
export interface TimelineMultipleResponse {
  success: boolean;
  timelines: TimelineAgente[];
  totalAgentes: number;
  message?: string;
}
