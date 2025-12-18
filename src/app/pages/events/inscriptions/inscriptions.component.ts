import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, map, of } from 'rxjs';
import { EventsService } from '../../../core/services/events.service';
import {
  type DesinscripcionActividadResponseDto,
  type EventDto,
  type EventRow,
  type InscripcionActividadResponseDto,
} from '../../../models/EventRow';
import { AuthService } from '../../../core/services/auth.service';

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
  registeringEventIds = new Set<string>();
  unregisteringEventIds = new Set<string>();

  isModalOpen = false;
  modalTitle = 'Confirmación';
  modalMessage = 'Inscripción exitosa.';

  constructor(
    private eventsService: EventsService,
    private authService: AuthService,
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
      .getEvents(this.authService.getUserId() ?? 0)
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
        // Hidratamos "ya inscrito" desde el backend (usuarioInscrito).
        this.registeredEventIds = new Set(rows.filter((r) => r.usuarioInscrito).map((r) => r.id));
        // Extra safety: si el backend deja la conexión abierta por alguna razón,
        // al menos no nos quedamos "cargando" luego de recibir data.
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  private toRow(dto: EventDto): EventRow {
    const hora = this.formatHora(dto.fechaInicio);
    const duracion = this.formatDuracion(dto.horas, dto.fechaInicio, dto.fechaFin);
    const firstHorarioId = dto.horarios?.[0]?.idHorarioActividad ?? null;

    return {
      id: String(dto.idActividad),
      idActividad: dto.idActividad,
      idOrganizacion: dto.idOrganizacion,
      idHorarioActividad: firstHorarioId,
      usuarioInscrito: !!dto.usuarioInscrito,
      nombreEvento: dto.nombre || '—',
      cupo: dto.cupos ?? 0,
      hora,
      lugar: dto.ubicacion?.direccion ?? '—',
      duracion,
      organizacion: dto.organizacion?.nombre ?? '—',
      nombreCoordinador: dto.usuarioCreador?.username ?? '—',
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

  isRegistering(eventId: string): boolean {
    return this.registeringEventIds.has(eventId);
  }

  isUnregistering(eventId: string): boolean {
    return this.unregisteringEventIds.has(eventId);
  }

  private normalizeInscripcionResponse(resp: any): InscripcionActividadResponseDto {
    // Preferimos camelCase, pero soportamos PascalCase por seguridad.
    return {
      idParticipanteActividad:
        resp?.idParticipanteActividad ?? resp?.IdParticipanteActividad ?? 0,
      idUsuario: resp?.idUsuario ?? resp?.IdUsuario ?? 0,
      idOrganizacion: resp?.idOrganizacion ?? resp?.IdOrganizacion ?? 0,
      idActividad: resp?.idActividad ?? resp?.IdActividad ?? 0,
      idHorarioActividad: resp?.idHorarioActividad ?? resp?.IdHorarioActividad ?? 0,
      fechaInscripcion: resp?.fechaInscripcion ?? resp?.FechaInscripcion ?? '',
      cuposRestantes: resp?.cuposRestantes ?? resp?.CuposRestantes ?? 0,
    };
  }

  private normalizeDesinscripcionResponse(resp: any): DesinscripcionActividadResponseDto {
    return {
      idUsuario: resp?.idUsuario ?? resp?.IdUsuario ?? 0,
      idOrganizacion: resp?.idOrganizacion ?? resp?.IdOrganizacion ?? 0,
      idActividad: resp?.idActividad ?? resp?.IdActividad ?? 0,
      idHorarioActividad: resp?.idHorarioActividad ?? resp?.IdHorarioActividad ?? 0,
      fechaRetiro: resp?.fechaRetiro ?? resp?.FechaRetiro ?? '',
      cuposRestantes: resp?.cuposRestantes ?? resp?.CuposRestantes ?? 0,
    };
  }

  onRegister(row: EventRow): void {
    if (this.isRegistered(row.id) || this.isRegistering(row.id) || this.isUnregistering(row.id)) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.modalTitle = 'Inicia sesión';
      this.modalMessage = 'Debes iniciar sesión para poder inscribirte.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    if (!row.idHorarioActividad) {
      this.modalTitle = 'No disponible';
      this.modalMessage = 'Este evento no tiene horarios disponibles para inscribirse.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    this.registeringEventIds.add(row.id);
    this.cdr.detectChanges();

    this.eventsService
      .inscribirUsuarioActividad({
        idUsuario: userId,
        idOrganizacion: row.idOrganizacion,
        idActividad: row.idActividad,
        idHorarioActividad: row.idHorarioActividad,
      })
      .pipe(
        finalize(() => {
          this.registeringEventIds.delete(row.id);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rawResp) => {
          const resp = this.normalizeInscripcionResponse(rawResp);

          this.registeredEventIds.add(row.id);

          // Actualizamos el cupo mostrado con lo que retorna el backend.
          const idx = this.events.findIndex((e) => e.id === row.id);
          if (idx >= 0) {
            this.events[idx] = {
              ...this.events[idx],
              cupo: resp.cuposRestantes,
              usuarioInscrito: true,
            };
          }

          const fechaTxt = resp.fechaInscripcion
            ? new Date(resp.fechaInscripcion).toLocaleString()
            : null;

          this.modalTitle = 'Confirmación';
          this.modalMessage =
            `Te inscribiste exitosamente en "${row.nombreEvento}".` +
            (fechaTxt ? `\nFecha: ${fechaTxt}` : '') +
            `\nCupos restantes: ${resp.cuposRestantes}`;
          this.isModalOpen = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          const status = err?.status as number | undefined;
          const message =
            err?.error?.message ||
            (status === 404
              ? 'No se encontró el recurso solicitado.'
              : status === 403
                ? 'No tienes permisos para realizar esta acción.'
                : status === 409
                  ? 'No se pudo completar la inscripción (conflicto).'
                  : status === 400
                    ? 'La solicitud no es válida.'
                    : 'Ocurrió un error al inscribirte. Intenta nuevamente.');

          this.modalTitle = 'Error';
          this.modalMessage = message;
          this.isModalOpen = true;
          this.cdr.detectChanges();
        },
      });
  }

  onUnregister(row: EventRow): void {
    if (!this.isRegistered(row.id) || this.isUnregistering(row.id) || this.isRegistering(row.id)) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.modalTitle = 'Inicia sesión';
      this.modalMessage = 'Debes iniciar sesión para poder desinscribirte.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    if (!row.idHorarioActividad) {
      this.modalTitle = 'No disponible';
      this.modalMessage = 'Este evento no tiene horario asociado para desinscripción.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    this.unregisteringEventIds.add(row.id);
    this.cdr.detectChanges();

    this.eventsService
      .desinscribirUsuarioActividad({
        idUsuario: userId,
        idOrganizacion: row.idOrganizacion,
        idActividad: row.idActividad,
        idHorarioActividad: row.idHorarioActividad,
      })
      .pipe(
        finalize(() => {
          this.unregisteringEventIds.delete(row.id);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rawResp) => {
          this.registeredEventIds.delete(row.id);

          const resp = this.normalizeDesinscripcionResponse(rawResp);
          const idx = this.events.findIndex((e) => e.id === row.id);
          if (idx >= 0) {
            this.events[idx] = {
              ...this.events[idx],
              cupo: resp.cuposRestantes,
              usuarioInscrito: false,
            };
          }

          const fechaTxt = resp.fechaRetiro ? new Date(resp.fechaRetiro).toLocaleString() : null;
          this.modalTitle = 'Listo';
          this.modalMessage =
            `Te desinscribiste de "${row.nombreEvento}".` +
            (fechaTxt ? `\nFecha: ${fechaTxt}` : '') +
            `\nCupos restantes: ${resp.cuposRestantes}`;
          this.isModalOpen = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          const status = err?.status as number | undefined;
          const message =
            err?.error?.message ||
            (status === 404
              ? 'No se encontró el recurso solicitado.'
              : status === 403
                ? 'No tienes permisos para realizar esta acción.'
                : status === 409
                  ? 'No se pudo completar la desinscripción (conflicto).'
                  : status === 400
                    ? 'La solicitud no es válida.'
                    : 'Ocurrió un error al desinscribirte. Intenta nuevamente.');

          this.modalTitle = 'Error';
          this.modalMessage = message;
          this.isModalOpen = true;
          this.cdr.detectChanges();
        },
      });
  }

  closeModal(): void {
    this.isModalOpen = false;
  }
}


