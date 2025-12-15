import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Pais,
  Provincia,
  Canton,
  Distrito,
  TipoCorrespondencia,
  TipoIdentificador,
  Universidad
} from '../../shared/models/reference-data.dto';

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {

  constructor(private api: ApiService) {}

  // Países
  getPaises(): Observable<Pais[]> {
    return this.api.get<Pais[]>('/Paises');
  }

  // Ubicaciones en cascada
  getProvincias(idPais: number): Observable<Provincia[]> {
    return this.api.get<Provincia[]>('/Ubicaciones/Provincias', { idPais });
  }

  getCantones(idPais: number, idProvincia: number): Observable<Canton[]> {
    return this.api.get<Canton[]>('/Ubicaciones/Cantones', { idPais, idProvincia });
  }

  getDistritos(idPais: number, idProvincia: number, idCanton: number): Observable<Distrito[]> {
    return this.api.get<Distrito[]>('/Ubicaciones/Distritos', { idPais, idProvincia, idCanton });
  }

  // Tipos de correspondencia
  getTiposCorrespondencia(): Observable<TipoCorrespondencia[]> {
    return this.api.get<TipoCorrespondencia[]>('/TiposCorrespondencia');
  }

  // Tipos de identificador
  getTiposIdentificador(): Observable<TipoIdentificador[]> {
    return this.api.get<TipoIdentificador[]>('/TipoIdentificador');
  }

  // Universidades
  getUniversidades(): Observable<Universidad[]> {
    return this.api.get<Universidad[]>('/Universidades');
  }
}

