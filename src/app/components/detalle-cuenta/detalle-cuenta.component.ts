import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CuentasClientesService } from '../../services/cuentas-clientes.service';
import { CuentaCliente, MatrimonioHistorial } from '../../models/cuenta-cliente.model';

@Component({
  selector: 'app-detalle-cuenta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detalle-cuenta.component.html',
  styleUrl: './detalle-cuenta.component.scss'
})
export class DetalleCuentaComponent implements OnInit {
  cuentaId: string | null = null;
  cuenta: CuentaCliente | null = null;

  cargando = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private cuentasService: CuentasClientesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[DetalleCuentaComponent] ngOnInit - Iniciando...');
    this.route.paramMap.subscribe(params => {
      console.log('[DetalleCuentaComponent] Params recibidos:', params);
      console.log('[DetalleCuentaComponent] Todos los params:', params.keys);
      this.cuentaId = params.get('cuentaId');
      console.log('[DetalleCuentaComponent] cuentaId extraído:', this.cuentaId);

      if (this.cuentaId) {
        console.log('[DetalleCuentaComponent] Cargando datos para cuenta:', this.cuentaId);
        this.cargarDatos();
      } else {
        console.error('[DetalleCuentaComponent] No se recibió cuentaId en los parámetros');
      }
    });
  }

  cargarDatos(): void {
    if (!this.cuentaId) {
      console.error('[DetalleCuentaComponent] cargarDatos - No hay cuentaId');
      return;
    }

    console.log('[DetalleCuentaComponent] cargarDatos - Iniciando carga para:', this.cuentaId);
    this.cargando = true;
    this.error = null;

    console.log('[DetalleCuentaComponent] Llamando al servicio obtenerDetalleCuenta...');
    this.cuentasService.obtenerDetalleCuenta(this.cuentaId).subscribe({
      next: (response) => {
        console.log('[DetalleCuentaComponent] Respuesta recibida:', response);
        this.cuenta = response.cuenta;
        this.cargando = false;
        console.log('[DetalleCuentaComponent] Datos cargados exitosamente, cargando=false');
        console.log('[DetalleCuentaComponent] Forzando detección de cambios...');
        this.cdr.detectChanges();
        console.log('[DetalleCuentaComponent] Detección de cambios completada');
      },
      error: (err) => {
        console.error('[DetalleCuentaComponent] Error al cargar cuenta:', err);
        console.error('[DetalleCuentaComponent] Status:', err.status);
        console.error('[DetalleCuentaComponent] Message:', err.message);
        this.error = 'No se pudo cargar el detalle de la cuenta';
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('[DetalleCuentaComponent] Error manejado, cargando=false');
      }
    });
  }

  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }

  obtenerClaseROI(roi: number): string {
    return roi >= 0 ? 'positivo' : 'negativo';
  }

  formatearFecha(fecha: Date | string): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    // Usar UTC para evitar desfases de zona horaria
    // La fecha en DB es UTC medianoche, debemos mostrarla tal cual sin conversión local
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    });
  }

  calcularDiasCasados(fechaInicio: Date | string, fechaFin?: Date | string): number {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = fechaFin ? (typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin) : new Date();

    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  obtenerEstiloDivorcio(motivo: string): string {
    return motivo === 'EXPULSION_TOP10' ? 'divorcio-expulsion' : 'divorcio-manual';
  }
}
