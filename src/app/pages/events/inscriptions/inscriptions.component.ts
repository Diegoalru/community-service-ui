import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, map, of } from 'rxjs';
import { EventsService } from '../../../core/services/events.service';
import {
  type DesinscripcionActividadResponseDto,
  type EventDto,
  type EventRow,
  type HorarioActividadBasicoDto,
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

  registeredHorarioKeys = new Set<string>();
  registeringHorarioKeys = new Set<string>();
  unregisteringHorarioKeys = new Set<string>();
  cuposRestantesByHorarioKey = new Map<string, number>();

  isModalOpen = false;
  modalTitle = 'Confirmación';
  modalMessage = 'Inscripción exitosa.';

  isHorariosModalOpen = false;
  selectedEvent: EventRow | null = null;

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
        // Un row por actividad (si no tiene horarios, no se muestra)
        map((items) => items.filter((dto) => (dto.horarios?.length ?? 0) > 0).map((dto) => this.toRow(dto))),
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

        // Hidratamos "ya inscrito" desde el backend (usuarioInscrito) POR HORARIO.
        this.registeredHorarioKeys = new Set(
          rows.flatMap((r) =>
            r.horarios
              .filter((h) => !!h.usuarioInscrito)
              .map((h) => this.horarioKey(r.idActividad, h.idHorarioActividad))
          ),
        );
        // Extra safety: si el backend deja la conexión abierta por alguna razón,
        // al menos no nos quedamos "cargando" luego de recibir data.
        this.isLoading = false;
        this.cdr.detectChanges();
      });
  }

  private toRow(dto: EventDto): EventRow {
    const horarios = dto.horarios ?? [];
    const normalized = horarios.map((h) => ({ ...h, usuarioInscrito: !!h.usuarioInscrito }));
    const sorted = [...normalized].sort((a, b) => {
      const da = new Date(a.horaInicio ?? a.fecha ?? '').getTime();
      const db = new Date(b.horaInicio ?? b.fecha ?? '').getTime();
      return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
    });
    const first = sorted[0] ?? null;

    const hora = first ? this.formatHorario(first.fecha, first.horaInicio, first.horaFin) : '—';
    const duracion = first ? this.formatDuracion(null, first.horaInicio, first.horaFin) : '—';

    return {
      id: String(dto.idActividad),
      idActividad: dto.idActividad,
      idOrganizacion: dto.idOrganizacion,
      usuarioInscrito: sorted.some((h) => !!h.usuarioInscrito),
      horarios: sorted,
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

  private formatFechaCorta(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  private formatHoraSolo(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private formatHorario(fecha: string | null, inicio: string | null, fin: string | null): string {
    const f = this.formatFechaCorta(fecha);
    const hi = this.formatHoraSolo(inicio);
    const hf = this.formatHoraSolo(fin);
    if (f === '—' && hi === '—' && hf === '—') return '—';
    if (hi !== '—' && hf !== '—') return `${f} ${hi} - ${hf}`;
    return `${f} ${hi !== '—' ? hi : hf}`;
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

  private horarioKey(idActividad: number, idHorarioActividad: number): string {
    return `${idActividad}-${idHorarioActividad}`;
  }

  private applyCuposToActividad(idActividad: number, cuposRestantes: number): void {
    // Actualiza el cupo agregado en la tabla
    const event = this.events.find((e) => e.idActividad === idActividad);
    if (event) {
      event.cupo = cuposRestantes;
      // Por limitación del API: aplicamos el mismo cupo a TODOS los horarios del evento
      event.horarios.forEach((h) => {
        const key = this.horarioKey(idActividad, h.idHorarioActividad);
        this.cuposRestantesByHorarioKey.set(key, cuposRestantes);
      });
    }

    // Si el modal está abierto para esta misma actividad, sincronizamos también ahí
    if (this.selectedEvent?.idActividad === idActividad) {
      this.selectedEvent.cupo = cuposRestantes;
      this.selectedEvent.horarios.forEach((h) => {
        const key = this.horarioKey(idActividad, h.idHorarioActividad);
        this.cuposRestantesByHorarioKey.set(key, cuposRestantes);
      });
    }
  }

  private setHorarioInscrito(idActividad: number, idHorarioActividad: number, value: boolean): void {
    const key = this.horarioKey(idActividad, idHorarioActividad);
    if (value) this.registeredHorarioKeys.add(key);
    else this.registeredHorarioKeys.delete(key);

    // Mutamos in-place para no romper referencias del modal abierto.
    const event = this.events.find((e) => e.idActividad === idActividad);
    if (event) {
      const h = event.horarios.find((x) => x.idHorarioActividad === idHorarioActividad);
      if (h) h.usuarioInscrito = value;
      event.usuarioInscrito = event.horarios.some((x) => !!x.usuarioInscrito);
    }

    if (this.selectedEvent?.idActividad === idActividad) {
      const h = this.selectedEvent.horarios.find((x) => x.idHorarioActividad === idHorarioActividad);
      if (h) h.usuarioInscrito = value;
      this.selectedEvent.usuarioInscrito = this.selectedEvent.horarios.some((x) => !!x.usuarioInscrito);
    }
  }

  isRegisteredHorario(idActividad: number, idHorarioActividad: number): boolean {
    return this.registeredHorarioKeys.has(this.horarioKey(idActividad, idHorarioActividad));
  }

  isRegisteringHorario(idActividad: number, idHorarioActividad: number): boolean {
    return this.registeringHorarioKeys.has(this.horarioKey(idActividad, idHorarioActividad));
  }

  isUnregisteringHorario(idActividad: number, idHorarioActividad: number): boolean {
    return this.unregisteringHorarioKeys.has(this.horarioKey(idActividad, idHorarioActividad));
  }

  getCuposRestantes(row: EventRow, horario: HorarioActividadBasicoDto): number {
    const key = this.horarioKey(row.idActividad, horario.idHorarioActividad);
    return this.cuposRestantesByHorarioKey.get(key) ?? row.cupo;
  }

  getDuracionHorario(horario: HorarioActividadBasicoDto): string {
    return this.formatDuracion(null, horario.horaInicio, horario.horaFin);
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

  openHorarios(row: EventRow): void {
    this.selectedEvent = row;
    this.isHorariosModalOpen = true;
    this.cdr.detectChanges();
  }

  closeHorariosModal(): void {
    this.isHorariosModalOpen = false;
    this.selectedEvent = null;
    this.cdr.detectChanges();
  }

  onRegisterHorario(row: EventRow, horario: HorarioActividadBasicoDto): void {
    const key = this.horarioKey(row.idActividad, horario.idHorarioActividad);
    if (!!horario.usuarioInscrito) return;
    if (this.registeringHorarioKeys.has(key) || this.unregisteringHorarioKeys.has(key)) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.modalTitle = 'Inicia sesión';
      this.modalMessage = 'Debes iniciar sesión para poder inscribirte.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    this.registeringHorarioKeys.add(key);
    this.cdr.detectChanges();

    this.eventsService
      .inscribirUsuarioActividad({
        idUsuario: userId,
        idOrganizacion: row.idOrganizacion,
        idActividad: row.idActividad,
        idHorarioActividad: horario.idHorarioActividad,
      })
      .pipe(
        finalize(() => {
          this.registeringHorarioKeys.delete(key);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rawResp) => {
          const resp = this.normalizeInscripcionResponse(rawResp);

          const idActividad = resp.idActividad || row.idActividad;
          const idHorarioActividad = resp.idHorarioActividad || horario.idHorarioActividad;
          const respKey = this.horarioKey(idActividad, idHorarioActividad);

          this.setHorarioInscrito(idActividad, idHorarioActividad, true);
          this.cuposRestantesByHorarioKey.set(respKey, resp.cuposRestantes);
          this.applyCuposToActividad(idActividad, resp.cuposRestantes);

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

  onUnregisterHorario(row: EventRow, horario: HorarioActividadBasicoDto): void {
    const key = this.horarioKey(row.idActividad, horario.idHorarioActividad);
    if (!horario.usuarioInscrito) return;
    if (this.unregisteringHorarioKeys.has(key) || this.registeringHorarioKeys.has(key)) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.modalTitle = 'Inicia sesión';
      this.modalMessage = 'Debes iniciar sesión para poder desinscribirte.';
      this.isModalOpen = true;
      this.cdr.detectChanges();
      return;
    }

    this.unregisteringHorarioKeys.add(key);
    this.cdr.detectChanges();

    this.eventsService
      .desinscribirUsuarioActividad({
        idUsuario: userId,
        idOrganizacion: row.idOrganizacion,
        idActividad: row.idActividad,
        idHorarioActividad: horario.idHorarioActividad,
      })
      .pipe(
        finalize(() => {
          this.unregisteringHorarioKeys.delete(key);
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rawResp) => {
          const resp = this.normalizeDesinscripcionResponse(rawResp);

          const idActividad = resp.idActividad || row.idActividad;
          const idHorarioActividad = resp.idHorarioActividad || horario.idHorarioActividad;
          const respKey = this.horarioKey(idActividad, idHorarioActividad);

          this.setHorarioInscrito(idActividad, idHorarioActividad, false);
          this.cuposRestantesByHorarioKey.set(respKey, resp.cuposRestantes);
          this.applyCuposToActividad(idActividad, resp.cuposRestantes);

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


