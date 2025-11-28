export interface PeriodoRoi {
  indice: number;
  fechaInicio: string;
  fechaFin: string;
  diasEnPeriodo: number;
  closePnlHipotesis: number;
  balanceInicial: number;
  roiHipotesis: number;
  cantidadTrades: number;
}

export interface RoiPorHipotesisResponse {
  success: boolean;
  agenteId: string;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  periodos: PeriodoRoi[];
  resumen: {
    roiPromedioHipotesis: number;
    roiFinalHipotesis: number;
    mejorPeriodo: {
      indice: number;
      fechaInicio: string;
      fechaFin: string;
      roi: number;
    };
    peorPeriodo: {
      indice: number;
      fechaInicio: string;
      fechaFin: string;
      roi: number;
    };
    totalPeriodos: number;
  };
}

export interface BalanceDiario {
  fecha: string;
  balance: number;
  closePnl: number;
  roiDia: number;
}

export interface RoiDiarioResponse {
  success: boolean;
  agente: {
    agente_id: string;
    userId: string;
    symbol: string;
  };
  fechaInicio?: string;
  fechaFin?: string;
  balancesDiarios: BalanceDiario[];
  resumen: {
    totalDias: number;
    balanceInicial: number;
    balanceFinal: number;
    roiTotal: number;
    gananciaTotal: number;
    mejorDia: {
      fecha: string;
      ganancia: number;
      roi: number;
    };
    peorDia: {
      fecha: string;
      perdida: number;
      roi: number;
    };
  };
}
