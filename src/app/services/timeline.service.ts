import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  TimelineAgenteResponse,
  TimelineGeneralResponse,
  TimelineMultipleResponse,
} from '../models/timeline.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TimelineService {
  private apiUrl = `${environment.apiUrl}/timeline`;

  constructor(private http: HttpClient) {}

  /**
   * Genera el timeline desde los datos de ROI diario
   */
  generarTimeline(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    agenteId?: string,
    sobreescribir: boolean = false
  ): Observable<{ success: boolean; totalGenerados: number; message?: string }> {
    let params = new HttpParams()
      .set('hipotesis', hipotesis.toString())
      .set('sobreescribir', sobreescribir.toString());

    if (agenteId) {
      params = params.set('agenteId', agenteId);
    }

    return this.http.post<{ success: boolean; totalGenerados: number; message?: string }>(
      `${this.apiUrl}/generar`,
      null,
      { params }
    );
  }

  /**
   * Obtiene el timeline de un agente específico
   */
  obtenerTimelineAgente(
    agenteId: string,
    hipotesis: 3 | 5 | 7 | 10 | 15
  ): Observable<TimelineAgenteResponse> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<TimelineAgenteResponse>(`${this.apiUrl}/agente/${agenteId}`, {
      params,
    });
  }

  /**
   * Obtiene el timeline general (resumen de todos los agentes)
   */
  obtenerTimelineGeneral(
    hipotesis: 3 | 5 | 7 | 10 | 15
  ): Observable<TimelineGeneralResponse> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<TimelineGeneralResponse>(`${this.apiUrl}/general`, { params });
  }

  /**
   * Obtiene todos los timelines de una hipótesis
   */
  obtenerTodosTimelines(
    hipotesis: 3 | 5 | 7 | 10 | 15
  ): Observable<TimelineMultipleResponse> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<TimelineMultipleResponse>(`${this.apiUrl}/todos`, { params });
  }

  /**
   * Elimina timelines
   */
  eliminarTimeline(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    agenteId?: string
  ): Observable<{ success: boolean; totalEliminados?: number; message?: string }> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (agenteId) {
      params = params.set('agenteId', agenteId);
    }

    return this.http.delete<{
      success: boolean;
      totalEliminados?: number;
      message?: string;
    }>(`${this.apiUrl}/eliminar`, { params });
  }
}
