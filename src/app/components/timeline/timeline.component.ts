import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Top10Service } from '../../services/top10.service';
import { EventoTop10, TipoEvento } from '../../models/top10.model';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.component.html',
  styleUrl: './timeline.component.scss'
})
export class TimelineComponent implements OnInit {
  eventos: EventoTop10[] = [];
  cargando = true;
  error: string | null = null;

  hipotesisActual: 3 | 5 | 7 | 10 | 15 = 5;
  hipotesisOpciones: (3 | 5 | 7 | 10 | 15)[] = [3, 5, 7, 10, 15];

  tipoFiltro: TipoEvento | 'TODOS' = 'TODOS';
  tiposEvento: (TipoEvento | 'TODOS')[] = ['TODOS', 'EXPULSION', 'REINGRESO', 'CAMBIO_POSICION', 'INGRESO_INICIAL'];

  limite = 50;
  offset = 0;
  total = 0;

  constructor(
    private top10Service: Top10Service,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos(): void {
    this.cargando = true;
    this.error = null;

    const filtros: any = {
      hipotesis: this.hipotesisActual,
      limit: this.limite,
      offset: this.offset
    };

    if (this.tipoFiltro !== 'TODOS') {
      filtros.tipo = this.tipoFiltro;
    }


    this.top10Service.obtenerHistorial(filtros).subscribe({
      next: (response) => {
        this.eventos = response.cambios;
        this.total = response.totalCambios;
        this.cargando = false;
        this.cdr.detectChanges();
        console.log('[TIMELINE] Estado actual:', {
          cargando: this.cargando,
          error: this.error,
          eventos: this.eventos.length,
          total: this.total
        });

        setTimeout(() => {
        }, 100);
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los eventos del timeline';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarHipotesis(hipotesis: 3 | 5 | 7 | 10 | 15): void {
    this.hipotesisActual = hipotesis;
    this.offset = 0;
    this.cargarEventos();
  }

  cambiarFiltroTipo(tipo: TipoEvento | 'TODOS'): void {
    this.tipoFiltro = tipo;
    this.offset = 0;
    this.cargarEventos();
  }

  cargarMas(): void {
    this.offset += this.limite;
    this.cargarEventos();
  }

  formatearFecha(fecha: Date | string): string {
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  obtenerIconoEvento(tipo: TipoEvento): string {
    switch (tipo) {
      case 'EXPULSION': return 'X';
      case 'REINGRESO': return '+';
      case 'CAMBIO_POSICION': return '↕';
      case 'INGRESO_INICIAL': return '*';
      default: return '?';
    }
  }

  obtenerClaseEvento(tipo: TipoEvento): string {
    switch (tipo) {
      case 'EXPULSION': return 'evento-expulsion';
      case 'REINGRESO': return 'evento-reingreso';
      case 'CAMBIO_POSICION': return 'evento-cambio';
      case 'INGRESO_INICIAL': return 'evento-inicial';
      default: return '';
    }
  }

  formatearPorcentaje(valor: number): string {
    return `${valor.toFixed(2)}%`;
  }
}
