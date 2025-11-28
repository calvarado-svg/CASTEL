import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DistribucionRoiResponse } from '../models/distribucion-roi.model';

@Injectable({
  providedIn: 'root'
})
export class DistribucionRoiService {
  private apiUrl = `${environment.apiUrl}/distribucion-roi`;

  constructor(private http: HttpClient) {}

  obtenerDistribucion(hipotesis: 3 | 5 | 7 | 10 | 15): Observable<DistribucionRoiResponse> {
    const params = new HttpParams().set('hipotesis', hipotesis.toString());
    return this.http.get<DistribucionRoiResponse>(this.apiUrl, { params });
  }
}
