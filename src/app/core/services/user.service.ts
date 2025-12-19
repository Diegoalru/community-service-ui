import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  type userRow,
  type perfilRow,
} from '../../models/user';
import { type PerfilDetalleDto } from '../../shared/models/perfil.dto';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

 getUser(idUsuario: number): Observable<userRow[]> {
    return this.http.post<userRow[]>(`${this.baseUrl}/Usuarios`, idUsuario);
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  getPerfilByUserId(idUsuario: number): Observable<PerfilDetalleDto> {
    return this.http.get<PerfilDetalleDto>(`${this.baseUrl}/Perfiles/usuario/${idUsuario}/detalle`);
  }

  /**
   * Legacy (no se usa actualmente). Se deja para no romper imports existentes.
   */
  getPerfil(dto: perfilRow): Observable<perfilRow> {
    return this.http.post<perfilRow>(`${this.baseUrl}/Perfiles`, dto);
  }



}


