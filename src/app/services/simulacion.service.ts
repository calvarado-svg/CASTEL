import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Simulacion,
  EjecutarSimulacionRequest,
  EjecutarSimulacionResponse,
  HistorialSimulacionesResponse,
  EstadoSimulacionResponse
} from '../models/simulacion.model';

@Injectable({
  providedIn: 'root'
})
export class SimulacionService {
  private apiUrl = `${environment.apiUrl}/simulacion`;

  constructor(private http: HttpClient) {}

  /**
   * Ejecuta una simulación completa
   */
  ejecutarSimulacion(request: EjecutarSimulacionRequest): Observable<EjecutarSimulacionResponse> {
    return this.http.post<EjecutarSimulacionResponse>(`${this.apiUrl}/ejecutar`, request);
  }

  /**
   * Obtiene el estado actual de una simulación
   * Útil para polling de progress bar
   */
  obtenerEstado(simulacionId: string): Observable<EstadoSimulacionResponse> {
    return this.http.get<EstadoSimulacionResponse>(`${this.apiUrl}/${simulacionId}`);
  }

  /**
   * Obtiene el historial de simulaciones ejecutadas
   * Soporta paginación
   */
  obtenerHistorial(limit: number = 10, offset: number = 0): Observable<HistorialSimulacionesResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<HistorialSimulacionesResponse>(`${this.apiUrl}/historial`, { params });
  }

  /**
   * Cancela una simulación en progreso
   */
  cancelarSimulacion(simulacionId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${simulacionId}/cancelar`
    );
  }
}
