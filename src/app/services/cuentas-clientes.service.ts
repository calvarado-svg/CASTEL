import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ResumenCuentas,
  DetalleCuentaResponse,
  CuentaCliente,
  CuentasPorAgenteResponse,
  HistorialMatrimoniosAgenteResponse
} from '../models/cuenta-cliente.model';

@Injectable({
  providedIn: 'root'
})
export class CuentasClientesService {
  private apiUrl = `${environment.apiUrl}/cuentas-clientes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene el resumen de todas las cuentas para una hipótesis
   */
  obtenerResumen(hipotesis: 3 | 5 | 7 | 10 | 15): Observable<ResumenCuentas> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<ResumenCuentas>(`${this.apiUrl}/resumen`, { params });
  }

  /**
   * Obtiene el detalle de una cuenta específica
   */
  obtenerDetalleCuenta(cuentaId: string): Observable<DetalleCuentaResponse> {
    return this.http.get<DetalleCuentaResponse>(`${this.apiUrl}/cuenta/${cuentaId}`);
  }

  /**
   * Obtiene todas las cuentas asignadas a un agente específico
   */
  obtenerCuentasPorAgente(agenteId: string, hipotesis: 3 | 5 | 7 | 10 | 15): Observable<CuentasPorAgenteResponse> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<CuentasPorAgenteResponse>(`${this.apiUrl}/agente/${agenteId}`, { params });
  }

  /**
   * Inicializa las 1000 cuentas para una hipótesis
   */
  inicializarCuentas(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<any> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.post<any>(`${this.apiUrl}/inicializar`, {}, { params });
  }

  /**
   * Actualiza los balances de todas las cuentas
   */
  actualizarBalances(
    hipotesis: 3 | 5 | 7 | 10 | 15,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<any> {
    let params = new HttpParams().set('hipotesis', hipotesis.toString());

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }
    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.put<any>(`${this.apiUrl}/actualizar-balances`, {}, { params });
  }

  /**
   * Cambia manualmente el agente de una cuenta
   */
  cambiarAgenteManual(
    cuentaId: string,
    nuevoAgenteId: string,
    nuevoUserId: string,
    nuevoSymbol: string
  ): Observable<{ success: boolean; message: string }> {
    const body = {
      nuevoAgenteId,
      nuevoUserId,
      nuevoSymbol
    };

    return this.http.put<{ success: boolean; message: string }>(
      `${this.apiUrl}/${cuentaId}/cambiar-agente`,
      body
    );
  }

  /**
   * Obtiene el historial de matrimonios y divorcios de un agente
   */
  obtenerHistorialMatrimoniosAgente(
    agenteId: string,
    hipotesis?: 3 | 5 | 7 | 10 | 15
  ): Observable<HistorialMatrimoniosAgenteResponse> {
    let params = new HttpParams();
    if (hipotesis) {
      params = params.set('hipotesis', hipotesis.toString());
    }
    return this.http.get<HistorialMatrimoniosAgenteResponse>(
      `${this.apiUrl}/agente/${agenteId}/historial-matrimonios`,
      { params }
    );
  }
}
