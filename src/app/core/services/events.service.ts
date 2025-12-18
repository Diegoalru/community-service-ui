import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EventDto,
  type InscribirUsuarioActividadRequestDto,
  type InscripcionActividadResponseDto,
  type DesinscripcionActividadResponseDto,
} from '../../models/EventRow';

@Injectable({ providedIn: 'root' })
export class EventsService {

  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getEvents(idUsuario: number): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/Actividades/available-activities?idUsuario=${idUsuario}`);
  }

  inscribirUsuarioActividad(dto: InscribirUsuarioActividadRequestDto): Observable<InscripcionActividadResponseDto> {
    return this.http.post<InscripcionActividadResponseDto>(`${this.baseUrl}/Actividades/inscribir-usuario`, dto);
  }

  desinscribirUsuarioActividad(
    dto: InscribirUsuarioActividadRequestDto
  ): Observable<DesinscripcionActividadResponseDto> {
    return this.http.post<DesinscripcionActividadResponseDto>(
      `${this.baseUrl}/Actividades/desinscribir-usuario`,
      dto
    );
  }

  /**
   * Ejemplos (placeholder) de llamados típicos.
   */
  createEvent(payload: Partial<EventDto>): Observable<EventDto> {
    return this.http.post<EventDto>(`${this.baseUrl}/events`, payload);
  }

  updateEvent(id: string, payload: Partial<EventDto>): Observable<EventDto> {
    return this.http.put<EventDto>(`${this.baseUrl}/events/${id}`, payload);
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/events/${id}`);
  }

  registerToEvent(eventId: string, payload: { userId: string }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/events/${eventId}/register`, payload);
  }
}


