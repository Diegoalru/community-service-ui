import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, map, of } from 'rxjs';
import { EventsService } from '../../../core/services/events.service';
import { type EventDto, type EventRow } from '../../../models/EventRow';

@Component({
  selector: 'app-inscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inscriptions.html',
  styleUrl: './inscriptions.css',
})
export class InscriptionsComponent implements OnInit {
  events: EventRow[] = [];
  isLoading = false;
  loadError: string | null = null;

  registeredEventIds = new Set<string>();

  isModalOpen = false;
  modalTitle = 'Confirmación';
  modalMessage = 'Inscripción exitosa.';

  constructor(
    private eventsService: EventsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  get isEmpty(): boolean {
    return this.events.length === 0;
  }

  private loadEvents(): void {
    this.isLoading = true;
    this.loadError = null;

    this.eventsService
      .getEvents()
      .pipe(
        map((items) => items.map((dto) => this.toRow(dto))),
        catchError(() => {
          // Sin validación ni auth; si el API no está arriba todavía, dejamos 0 datos.
          this.loadError = null;
          return of([] as EventRow[]);
        }),
        finalize(() => {
          this.isLoading = false;
          // En modo zoneless, forzamos refresh de la vista.
          this.cdr.detectChanges();
        })
      )
      .subscribe((rows) => {
        this.events = rows;
        // Extra safety: si el backend deja la conexión abierta por alguna razón,
        // al menos no nos quedamos "cargando" luego de recibir data.
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  private toRow(dto: EventDto): EventRow {
    const hora = this.formatHora(dto.fechaInicio);
    const duracion = this.formatDuracion(dto.horas, dto.fechaInicio, dto.fechaFin);

    return {
      id: String(dto.idActividad),
      nombreEvento: dto.nombre ?? '—',
      cupo: dto.cupos ?? 0,
      hora,
      // El API actual no envía estos campos; se dejan como placeholder.
      lugar: '—',
      duracion,
      organizacion: '—',
      nombreCoordinador: '—',
    };
  }

  private formatHora(fechaInicio: string | null): string {
    if (!fechaInicio) return '—';
    const d = new Date(fechaInicio);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private formatDuracion(horas: number | null, inicio: string | null, fin: string | null): string {
    if (horas !== null && horas !== undefined) return `${horas} horas`;
    if (!inicio || !fin) return '—';

    const d1 = new Date(inicio);
    const d2 = new Date(fin);
    if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return '—';

    const ms = d2.getTime() - d1.getTime();
    if (ms <= 0) return '—';

    const hours = Math.round((ms / 36e5) * 10) / 10; // 1 decimal
    return `${hours} horas`;
  }

  isRegistered(eventId: string): boolean {
    return this.registeredEventIds.has(eventId);
  }

  onRegister(row: EventRow): void {
    if (this.isRegistered(row.id)) return;

    // Aquí luego puedes llamar API; por ahora simulamos éxito.
    this.registeredEventIds.add(row.id);

    this.modalTitle = 'Confirmación';
    this.modalMessage = `Te inscribiste exitosamente en "${row.nombreEvento}".`;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}


