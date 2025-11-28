import { Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DistribucionRoiService } from '../../services/distribucion-roi.service';
import { DistribucionRoiResponse, RangoBucket } from '../../models/distribucion-roi.model';
import { catchError, of, timeout } from 'rxjs';

@Component({
  selector: 'app-distribucion-roi-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './distribucion-roi-chart.component.html',
  styleUrl: './distribucion-roi-chart.component.scss'
})
export class DistribucionRoiChartComponent implements OnInit, OnChanges {
  @Input() hipotesis: 3 | 5 | 7 | 10 | 15 = 5;

  distribucion: DistribucionRoiResponse | null = null;
  cargando = false;
  error: string | null = null;

  // Todos los buckets (incluyendo los vacíos)
  allBuckets: RangoBucket[] = [];
  maxCuentas = 0;

  constructor(
    private distribucionRoiService: DistribucionRoiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarDistribucion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hipotesis'] && !changes['hipotesis'].firstChange) {
      this.cargarDistribucion();
    }
  }

  cargarDistribucion(): void {
    this.cargando = true;
    this.error = null;

    this.distribucionRoiService.obtenerDistribucion(this.hipotesis)
      .pipe(
        timeout(30000),
        catchError((err) => {
          console.error('Error al cargar distribución ROI:', err);
          this.error = 'No se pudo cargar la distribución de ROI';
          this.cargando = false;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.distribucion = response;
            this.procesarBuckets();
          }
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  procesarBuckets(): void {
    if (!this.distribucion) return;

    // Usar todos los buckets (incluyendo los vacíos)
    this.allBuckets = this.distribucion.buckets;

    // Calcular el máximo para las barras (solo de los que tienen datos)
    const bucketsConDatos = this.allBuckets.filter(b => b.cantidadCuentas > 0);
    this.maxCuentas = bucketsConDatos.length > 0
      ? Math.max(...bucketsConDatos.map(b => b.cantidadCuentas))
      : 1;
  }

  obtenerAnchoBarra(cantidadCuentas: number): number {
    if (this.maxCuentas === 0) return 0;
    return (cantidadCuentas / this.maxCuentas) * 100;
  }

  obtenerClaseRoi(rangoMin: number): string {
    if (rangoMin >= 0) return 'positivo';
    return 'negativo';
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-ES').format(valor);
  }
}
