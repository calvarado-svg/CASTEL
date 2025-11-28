import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Top10Response,
  HistorialTop10Response,
  DetalleAgenteEnRankingResponse,
  TipoEvento
} from '../models/top10.model';

@Injectable({
  providedIn: 'root'
})
export class Top10Service {
  private apiUrl = `${environment.apiUrl}/top10`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el ranking TOP10 para una hipótesis y rango de fechas
   */
  obtenerRanking(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<Top10Response> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<Top10Response>(`${this.apiUrl}/ranking`, { params });
  }

  /**
   * Obtiene el detalle de un agente específico en el ranking
   */
  obtenerDetalleAgente(
    agenteId: string,
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<DetalleAgenteEnRankingResponse> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<DetalleAgenteEnRankingResponse>(`${this.apiUrl}/agente/${agenteId}`, { params });
  }

  /**
   * Obtiene el historial de cambios en el TOP10
   */
  obtenerHistorial(filtros: {
    hipotesis?: 3 | 5 | 7 | 10 | 15;
    tipo?: TipoEvento;
    agenteId?: string;
    fechaInicio?: string;
    fechaFin?: string;
    limit?: number;
    offset?: number;
  }): Observable<HistorialTop10Response> {
    let params = new HttpParams();

    if (filtros.hipotesis) {
      params = params.set('hipotesis', filtros.hipotesis.toString());
    }
    if (filtros.tipo) {
      params = params.set('tipo', filtros.tipo);
    }
    if (filtros.agenteId) {
      params = params.set('agenteId', filtros.agenteId);
    }
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.limit) {
      params = params.set('limit', filtros.limit.toString());
    }
    if (filtros.offset) {
      params = params.set('offset', filtros.offset.toString());
    }

    const url = `${this.apiUrl}/historial`;
    console.log('[TOP10_SERVICE] Llamando a:', url);
    console.log('[TOP10_SERVICE] Con parametros:', params.toString());
    console.log('[TOP10_SERVICE] URL completa:', `${url}?${params.toString()}`);

    return this.http.get<HistorialTop10Response>(`${this.apiUrl}/historial`, { params });
  }

  /**
   * Obtiene todos los agentes con sus períodos de ROI
   */
  obtenerTodosAgentes(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<TodosAgentesRankingResponse> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    const url = `${this.apiUrl}/agentes/todos`;
    console.log('[TOP10_SERVICE] Llamando a:', url);
    console.log('[TOP10_SERVICE] Con parametros:', params.toString());

    return this.http.get<TodosAgentesRankingResponse>(`${url}`, { params });
  }
}

export interface TodosAgentesRankingResponse {
  success: boolean;
  hipotesis: 3 | 5 | 7 | 10 | 15;
  totalAgentes: number;
  agentes: {
    agente_id: string;
    userId: string;
    symbol: string;
    posicion: number;
    estadoAgente: 'ACTIVO' | 'EN_ESPERA' | 'EXPULSADO';
    periodos: {
      indice: number;
      fechaInicio: string;
      fechaFin: string;
      diasEnPeriodo: number;
      roiHipotesis: number;
      balanceInicial: number;
      closePnlHipotesis: number;
    }[];
  }[];
}
