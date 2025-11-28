import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SimulacionService } from '../../services/simulacion.service';
import { EjecutarSimulacionRequest, EjecutarSimulacionResponse } from '../../models/simulacion.model';

@Component({
  selector: 'app-nueva-simulacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-simulacion.component.html',
  styleUrl: './nueva-simulacion.component.scss'
})
export class NuevaSimulacionComponent {
  // Formulario
  hipotesis: 3 | 5 | 7 | 10 | 15 = 5;
  dias: number = 30;
  fechaInicio: string = '2025-05-01';
  fechaFin: string = '2025-05-31';
  // NOTA: La limpieza de datos es ahora automática, no se necesita el campo

  // Estados
  ejecutando = false;
  error: string | null = null;
  resultado: EjecutarSimulacionResponse | null = null;
  mostrarNotificacion = false;
  mensajeProgreso: string | null = null;

  // Opciones de hipótesis
  hipotesisOpciones: Array<3 | 5 | 7 | 10 | 15> = [3, 5, 7, 10, 15];

  constructor(
    private simulacionService: SimulacionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  /**
   * Ejecuta la simulación
   */
  ejecutarSimulacion(): void {
    // Validar formulario
    if (!this.validarFormulario()) {
      return;
    }

    this.ejecutando = true;
    this.error = null;
    this.resultado = null;

    const request: EjecutarSimulacionRequest = {
      hipotesis: this.hipotesis,
      dias: this.dias,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin
    };

    this.simulacionService.ejecutarSimulacion(request).subscribe({
      next: (response) => {
        // Ejecutar dentro de NgZone para asegurar detección de cambios
        this.ngZone.run(() => {
          console.log('Simulación ejecutada exitosamente:', response);
          this.resultado = response;
          this.ejecutando = false;
          this.mensajeProgreso = null;

          // Mostrar notificación de éxito
          this.mostrarNotificacion = true;

          // Forzar detección de cambios
          this.cdr.detectChanges();

          // Auto-ocultar notificación después de 5 segundos
          setTimeout(() => {
            this.mostrarNotificacion = false;
            this.cdr.detectChanges();
          }, 5000);

          // Scroll al resultado
          setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 100);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('Error al ejecutar simulación:', err);
          this.error = err.error?.message || 'Error al ejecutar la simulación. Por favor, intenta nuevamente.';
          this.ejecutando = false;
          this.mensajeProgreso = null;
          this.cdr.detectChanges();
        });
      }
    });
  }

  /**
   * Cierra la notificación de éxito
   */
  cerrarNotificacion(): void {
    this.mostrarNotificacion = false;
  }

  /**
   * Valida el formulario
   */
  private validarFormulario(): boolean {
    // Validar fechas
    const fechaInicioDate = new Date(this.fechaInicio);
    const fechaFinDate = new Date(this.fechaFin);

    if (fechaInicioDate >= fechaFinDate) {
      this.error = 'La fecha de inicio debe ser anterior a la fecha de fin.';
      return false;
    }

    // Validar días
    const diasCalculados = Math.floor(
      (fechaFinDate.getTime() - fechaInicioDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasCalculados !== this.dias) {
      this.error = `La diferencia entre fechas es de ${diasCalculados} días, pero especificaste ${this.dias} días.`;
      return false;
    }

    if (this.dias <= 0 || this.dias > 365) {
      this.error = 'Los días deben estar entre 1 y 365.';
      return false;
    }

    return true;
  }

  /**
   * Calcula automáticamente la fecha fin según los días
   */
  calcularFechaFin(): void {
    if (!this.fechaInicio || !this.dias) {
      return;
    }

    const fechaInicioDate = new Date(this.fechaInicio);
    const fechaFinDate = new Date(fechaInicioDate);
    fechaFinDate.setDate(fechaFinDate.getDate() + this.dias);

    this.fechaFin = fechaFinDate.toISOString().split('T')[0];
  }

  /**
   * Navega al dashboard
   */
  volverAlDashboard(): void {
    this.router.navigate(['/']);
  }

  /**
   * Ver detalles de la simulación ejecutada
   */
  verDetalles(): void {
    if (this.resultado) {
      this.router.navigate(['/simulacion', this.resultado.simulacionId]);
    }
  }

  /**
   * Resetea el formulario
   */
  resetearFormulario(): void {
    this.hipotesis = 5;
    this.dias = 30;
    this.fechaInicio = '2025-05-01';
    this.fechaFin = '2025-05-31';
    this.error = null;
    this.resultado = null;
  }

  /**
   * Formatea un número como moneda
   */
  formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(valor);
  }

  /**
   * Formatea un porcentaje
   */
  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }
}
