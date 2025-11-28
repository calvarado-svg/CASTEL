export interface AgenteRanking {
  posicion: number;
  agente_id: string;
  userId: string;
  symbol: string;
  roiHipotesis: number; // ROI del último periodo (usado para el ranking)
  roiUltimoPeriodo: number; // Mismo valor que roiHipotesis
  roiPromedio: number; // ROI promedio de todos los periodos
  estadoAgente: 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO';
  periodos: number;
  cuentasAsignadas?: number;

  // Solo para agentes expulsados
  reglaViolada?: 'REGLA_1_PERDIDAS_CONSECUTIVAS' | 'REGLA_2_ROI_CRITICO';
  fechaExpulsion?: string;
  periodoExpulsion?: {
    indice: number;
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface Top10Response {
  success: boolean;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  fechaInicio?: string;
  fechaFin?: string;
  top10: AgenteRanking[];
  siguientes10: AgenteRanking[];
  agentesExpulsados: AgenteRanking[];
  resumen: {
    totalAgentesEvaluados: number;
    totalAgentesActivos: number;
    totalAgentesEnEspera: number;
    totalAgentesExpulsados: number;
  };
}

export type TipoEvento = 'EXPULSION' | 'REINGRESO' | 'CAMBIO_POSICION' | 'INGRESO_INICIAL';
export type ReglaViolada = 'REGLA_1_PERDIDAS_CONSECUTIVAS' | 'REGLA_2_ROI_CRITICO';

export interface EventoTop10 {
  _id?: string;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  fecha: Date | string;
  tipo: TipoEvento;

  agenteAfectado: {
    agente_id: string;
    userId: string;
    symbol: string;
    posicionAnterior?: number;
    posicionNueva?: number;
    roiHipotesis: number;
  };

  reglaViolada?: ReglaViolada;

  periodoAfectado?: {
    indice: number;
    fechaInicio: string;
    fechaFin: string;
  };

  agenteReemplazo?: {
    agente_id: string;
    userId: string;
    symbol: string;
    posicionNueva: number;
    roiHipotesis: number;
  };

  agenteSaliente?: {
    agente_id: string;
    userId: string;
    symbol: string;
    posicionAnterior: number;
    roiHipotesis: number;
  };

  razon?: string;

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface HistorialTop10Response {
  success: boolean;
  cambios: EventoTop10[];
  totalCambios: number;
  hipotesis?: number;
  filtros?: {
    tipo?: TipoEvento;
    agenteId?: string;
    fechaInicio?: string;
    fechaFin?: string;
  };
}

export interface DetalleAgenteEnRankingResponse {
  success: boolean;
  agente: AgenteRanking | null;
  periodos: PeriodoHipotesis[];
  historialEnTop10?: HistorialAgentePeriodo[];
}

export interface PeriodoHipotesis {
  indice: number;
  fechaInicio: string;
  fechaFin: string;
  diasEnPeriodo: number;
  closePnlHipotesis: number;
  balanceInicial: number;
  roiHipotesis: number;
  cantidadTrades: number;
}

export interface HistorialAgentePeriodo {
  fecha: string;
  evento: 'INGRESO_INICIAL' | 'CAMBIO_POSICION' | 'EXPULSION' | 'REINGRESO';
  posicion?: number;
  posicionAnterior?: number;
  posicionNueva?: number;
  reglaViolada?: string;
}
