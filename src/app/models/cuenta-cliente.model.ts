export interface CuentaCliente {
  _id?: string;
  cuenta_id: string; // "CTA-0001"
  hipotesis: 3 | 5 | 7 | 10 | 15;
  balanceInicial: number;
  balanceActual: number;
  roiAcumulado: number;
  estado: 'ACTIVA' | 'INACTIVA' | 'PAUSADA';

  agenteActual: AgenteMatrimonio;
  historialMatrimonios: MatrimonioHistorial[];

  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AgenteMatrimonio {
  agente_id: string;
  userId: string;
  symbol: string;
  fechaMatrimonio: Date | string;
  balanceAlCasarse: number;
  roiConEsteAgente: number;
  diasCasados?: number;
}

export interface MatrimonioHistorial {
  agente_id: string;
  userId: string;
  symbol: string;
  fechaMatrimonio: Date | string;
  fechaDivorcio: Date | string;
  motivoDivorcio: 'EXPULSION_TOP10' | 'CAMBIO_MANUAL';
  balanceAlCasarse: number;
  balanceAlDivorciarse: number;
  roiGenerado: number;
  diasCasados?: number;
}

export interface ResumenCuentas {
  success: boolean;
  resumen: {
    totalCuentas: number;
    balanceInicialTotal: number;
    balanceActualTotal: number;
    roiPromedioGlobal: number;
    gananciaTotal: number;
    distribucionPorAgente: DistribucionAgente[];
  };
}

export interface DistribucionAgente {
  agente_id: string;
  userId: string;
  symbol: string;
  cuentasAsignadas: number;
  balanceTotalCuentas: number;
  roiPromedioAgente: number;
}

export interface DetalleCuentaResponse {
  success: boolean;
  cuenta: CuentaCliente;
}

export interface CuentasPorAgenteResponse {
  success: boolean;
  agente: {
    agente_id: string;
    userId: string;
    symbol: string;
  };
  totalCuentas: number;
  balanceTotalCuentas: number;
  roiPromedioAgente: number;
  cuentas: Array<{
    cuenta_id: string;
    balanceInicial: number;
    balanceActual: number;
    balanceAlCasarse: number;
    roiAcumulado: number;
    roiConEsteAgente: number;
    fechaMatrimonio: string;
    numMatrimoniosAnteriores: number;
  }>;
}

export interface HistorialMatrimoniosAgenteResponse {
  success: boolean;
  agente_id: string;
  matrimoniosActuales: Array<{
    cuenta_id: string;
    fechaMatrimonio: string;
    balanceAlCasarse: number;
    balanceActual: number;
    roiConEsteAgente: number;
  }>;
  matrimoniosHistoricos: Array<{
    cuenta_id: string;
    fechaMatrimonio: string;
    fechaDivorcio: string;
    motivoDivorcio: string;
    balanceAlCasarse: number;
    balanceAlDivorciarse: number;
    roiGenerado: number;
  }>;
  resumen: {
    totalMatrimoniosActuales: number;
    totalDivorcios: number;
    roiTotalGenerado: number;
  };
}
