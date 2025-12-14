import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EventDto } from '../../models/EventRow';

@Injectable({ providedIn: 'root' })
export class EventsService {
  /**
   * `proxy.conf.json` mapea `/api` -> `https://localhost:44354`
   * para evitar CORS.
   */
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getEvents(): Observable<EventDto[]> {
    // OJO: baseUrl ya incluye /api (proxy). No dupliques /api aquí.
    return this.http.get<EventDto[]>(`${this.baseUrl}/Actividades`);
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


