import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { type MisHorasDto } from '../../shared/models/mis-horas.dto';

@Injectable({ providedIn: 'root' })
export class MyHoursService {
  constructor(private api: ApiService) {}

  getMisHoras(idUsuario: number): Observable<MisHorasDto> {
    return this.api.get<MisHorasDto>('/Actividades/mis-horas', { idUsuario });
  }
}


