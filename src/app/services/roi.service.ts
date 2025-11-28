import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RoiPorHipotesisResponse, RoiDiarioResponse } from '../models/roi.model';

@Injectable({
  providedIn: 'root'
})
export class RoiService {
  private apiUrl = `${environment.apiUrl}/roi`;

  constructor(private http: HttpClient) {}

  obtenerRoiPorHipotesis(
    agenteId: string,
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<RoiPorHipotesisResponse> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<RoiPorHipotesisResponse>(
      `${this.apiUrl}/agente/${agenteId}/hipotesis/${hipotesis}`,
      { params }
    );
  }

  obtenerRoiDiario(
    agenteId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<RoiDiarioResponse> {
    let params = new HttpParams();

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<RoiDiarioResponse>(`${this.apiUrl}/agente/${agenteId}`, { params });
  }

  /**
   * Obtiene el ROI diario acumulado de todos los agentes
   */
  obtenerTodosAgentesRoiDiario(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<TodosAgentesRoiDiarioResponse> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    const url = `${this.apiUrl}/agentes/todos/diario`;
    console.log('[ROI_SERVICE] Llamando a:', url);
    console.log('[ROI_SERVICE] Con parametros:', params.toString());

    return this.http.get<TodosAgentesRoiDiarioResponse>(url, { params });
  }

  /**
   * Obtiene el ROI diario acumulado de todos los agentes CON FILTRO ESTRICTO DE FECHAS
   * Requiere fechaInicio y fechaFin
   */
  obtenerTodosAgentesRoiDiarioFiltrado(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio: string,
    fechaFin: string
  ): Observable<TodosAgentesRoiDiarioResponse> {
    let params = new HttpParams()
      .set('hipotesis', hipotesis.toString())
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    const url = `${this.apiUrl}/agentes/todos/diario/filtrado`;
    console.log('[ROI_SERVICE] Llamando a:', url, '(CON FILTRO)');
    console.log('[ROI_SERVICE] Con parametros:', params.toString());
    console.log('[ROI_SERVICE] Rango:', { desde: fechaInicio, hasta: fechaFin });

    return this.http.get<TodosAgentesRoiDiarioResponse>(url, { params });
  }

  /**
   * Obtiene el ROI General (acumulado de todos los agentes)
   * Devuelve dos curvas: ROI positivo y ROI negativo (caída)
   */
  obtenerRoiGeneral(
    hipotesis: 3 | 5 | 7 | 10 | 15
  ): Observable<RoiGeneralResponse> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    const url = `${this.apiUrl}/roi-general`;
    console.log('[ROI_SERVICE] Llamando a ROI General:', url);
    console.log('[ROI_SERVICE] Con parametros:', params.toString());

    return this.http.get<RoiGeneralResponse>(url, { params });
  }
}

export interface TodosAgentesRoiDiarioResponse {
  success: boolean;
  totalAgentes: number;
  fechaInicio?: string;
  fechaFin?: string;
  agentes: {
    agente_id: string;
    userId: string;
    symbol: string;
    posicion: number;
    estadoAgente: 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO';
    dias: {
      fecha: string;
      roiAcumuladoSumado: number;
      roiRealAcumulado: number;
      roiDiario: number;
      closePnlNdia: number;
      balance: number;
    }[];
  }[];
}

export interface AgenteTop10Dia {
  agente_id: string;
  userId: string;
  symbol: string;
  posicion: number;
  roiHipotesis: number;
}

export interface RoiGeneralResponse {
  success: boolean;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  fechaInicio?: string;
  fechaFin?: string;
  datos: {
    fecha: string;
    roiGeneralAcumulado: number;
    roiGeneralCaidaAcumulado: number;
    top10: AgenteTop10Dia[];
  }[];
}
