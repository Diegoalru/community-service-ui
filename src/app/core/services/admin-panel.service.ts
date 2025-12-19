import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import {
  GetOrganizacionesConEstadoDto,
  GestionarVoluntariadoDto,
  GetUsuariosPorOrgDto,
  EliminarUsuarioOrgDto,
  ActualizarUsuarioOrgDto,
  CambiarRolUsuarioDto,
  GetActividadesPorOrgDto,
  GetHorariosPorActDto,
  EliminarActividadDto,
  EliminarHorarioDto,
  ActividadCreacionIntegracionDto,
  ActividadActualizacionIntegracionDto,
  HorarioActividadCreateDto,
  OrganizacionConEstadoApi,
  OrganizacionConEstado,
  UsuarioDeOrganizacionApi,
  UsuarioDeOrganizacion,
  ActividadRow,
  HorarioRow,
  CategoriaActividad,
  ApiMensajeAdmin,
  normalizarOrganizacion,
  normalizarUsuario,
  GetByIdDto,
  ActualizarOrganizacionDto,
} from '../../shared/models/admin-panel.dto';

@Injectable({ providedIn: 'root' })
export class AdminPanelService {
  constructor(private api: ApiService) {}

  // ============================================================================
  // Organizaciones y Roles
  // ============================================================================

  /**
   * Obtiene lista de organizaciones con el estado/rol del usuario en cada una
   */
  getOrganizacionesConEstado(dto: GetOrganizacionesConEstadoDto): Observable<OrganizacionConEstado[]> {
    return this.api.post<OrganizacionConEstadoApi[]>('/Integracion/GetOrganizacionesConEstado', dto).pipe(
      map((orgs) => orgs.map(normalizarOrganizacion))
    );
  }

  /**
   * Obtiene una única organización por su ID.
   */
  getOrganizacionById(dto: GetByIdDto): Observable<any> { // TODO: Replace 'any' with a proper normalized interface
    return this.api.post<any>('/Integracion/GetOrganizacionById', dto);
  }

  /**
   * Actualiza una organización existente.
   */
  actualizarOrganizacion(dto: ActualizarOrganizacionDto): Observable<ApiMensajeAdmin> {
    return this.api.put<ApiMensajeAdmin>('/Integracion/ActualizarOrganizacion', dto);
  }

  /**
   * Suscribir/desuscribir usuario como voluntario en una organización
   */
  gestionarVoluntariado(dto: GestionarVoluntariadoDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/Integracion/GestionarVoluntariado', dto);
  }

  /**
   * Obtiene lista de usuarios/miembros de una organización
   */
  getUsuariosPorOrg(dto: GetUsuariosPorOrgDto): Observable<UsuarioDeOrganizacion[]> {
    return this.api.post<UsuarioDeOrganizacionApi[]>('/Integracion/GetUsuariosPorOrg', dto).pipe(
      map((users) => users.map(normalizarUsuario))
    );
  }

  /**
   * Elimina (lógicamente) el rol de un usuario en una organización
   */
  eliminarUsuarioOrg(dto: EliminarUsuarioOrgDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/Integracion/EliminarUsuarioOrg', dto);
  }

  /**
   * Activa/desactiva el rol de un usuario en una organización
   */
  actualizarUsuarioOrg(dto: ActualizarUsuarioOrgDto): Observable<ApiMensajeAdmin> {
    return this.api.put<ApiMensajeAdmin>('/Integracion/ActualizarUsuarioOrg', dto);
  }

  /**
   * Cambia el rol de un usuario en una organización
   */
  cambiarRolUsuario(dto: CambiarRolUsuarioDto): Observable<ApiMensajeAdmin> {
    return this.api.put<ApiMensajeAdmin>('/Integracion/CambiarRolUsuario', dto);
  }

  // ============================================================================
  // Actividades
  // ============================================================================

  /**
   * Obtiene las categorías de actividades disponibles
   */
  getCategoriasActividad(): Observable<CategoriaActividad[]> {
    return this.api.get<CategoriaActividad[]>('/CategoriasActividad');
  }

  /**
   * Crea una nueva actividad
   */
  crearActividad(dto: ActividadCreacionIntegracionDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/Integracion/CrearActividad', dto);
  }

  /**
   * Actualiza una actividad existente
   */
  actualizarActividad(dto: ActividadActualizacionIntegracionDto): Observable<ApiMensajeAdmin> {
    return this.api.put<ApiMensajeAdmin>('/Integracion/ActualizarActividad', dto);
  }

  /**
   * Obtiene las actividades de una organización
   */
  getActividadesPorOrg(dto: GetActividadesPorOrgDto): Observable<ActividadRow[]> {
    return this.api.post<ActividadRow[]>('/Integracion/GetActividadesPorOrg', dto);
  }

  /**
   * Obtiene una única actividad por su ID.
   */
  getActividadById(dto: GetByIdDto): Observable<any> { // TODO: Replace 'any' with a proper normalized interface
    return this.api.post<any>('/Integracion/GetActividadById', dto);
  }

  /**
   * Elimina (lógicamente) una actividad
   */
  eliminarActividad(dto: EliminarActividadDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/Integracion/EliminarActividad', dto);
  }

  // ============================================================================
  // Horarios
  // ============================================================================

  /**
   * Obtiene los horarios de una actividad
   */
  getHorariosPorActividad(dto: GetHorariosPorActDto): Observable<HorarioRow[]> {
    return this.api.post<HorarioRow[]>('/Integracion/GetHorariosPorAct', dto);
  }

  /**
   * Obtiene un único horario por su ID.
   */
  getHorarioById(dto: GetByIdDto): Observable<any> { // TODO: Replace 'any' with a proper normalized interface
    return this.api.post<any>('/Integracion/GetHorarioById', dto);
  }

  /**
   * Crea un nuevo horario para una actividad
   */
  crearHorario(dto: HorarioActividadCreateDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/HorariosActividad', dto);
  }

  /**
   * Elimina (lógicamente) un horario
   */
  eliminarHorario(dto: EliminarHorarioDto): Observable<ApiMensajeAdmin> {
    return this.api.post<ApiMensajeAdmin>('/Integracion/EliminarHorario', dto);
  }
}

