import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  type userRow,
  type perfilRow,
} from '../../models/user';

@Injectable({ providedIn: 'root' })
export class UserService {

  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

 getUser(idUsuario: number): Observable<userRow[]> {
    return this.http.post<userRow[]>(`${this.baseUrl}/Usuarios`, idUsuario);
  }

  getPerfil(dto: perfilRow): Observable<perfilRow> {
    return this.http.post<perfilRow>(`${this.baseUrl}/Perfiles`, dto);
  }



}


