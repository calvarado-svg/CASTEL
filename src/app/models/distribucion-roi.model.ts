export interface RangoBucket {
  rangoId: string;
  rangoLabel: string;
  rangoMin: number;
  rangoMax: number;
  cantidadCuentas: number;
  aum: number;
  porcentajeCuentas: number;
  porcentajeAum: number;
}

export interface DistribucionRoiResponse {
  success: boolean;
  hipotesis: number;
  fechaCalculo: string;
  totalCuentas: number;
  totalAum: number;
  buckets: RangoBucket[];
}
