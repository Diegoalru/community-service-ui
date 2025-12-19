// ============================================================================
// DTOs para el Panel de Administración
// ============================================================================

// --- DTOs de Request ---

export interface GetOrganizacionesConEstadoDto {
  idUsuario: number;
}

export interface GestionarVoluntariadoDto {
  idUsuario: number;
  idOrganizacion: number;
  accion: 'suscribir' | 'desuscribir';
}

export interface GetUsuariosPorOrgDto {
  idOrganizacion: number;
}

export interface EliminarUsuarioOrgDto {
  idUsuarioSolicitante: number;
  idRolUsuarioOrganizacion: number;
}

export interface ActualizarUsuarioOrgDto {
  idUsuarioSolicitante: number;
  idRolUsuarioOrganizacion: number;
  esActivo: boolean;
}

export interface CambiarRolUsuarioDto {
  idUsuarioSolicitante: number;
  idRolUsuarioOrganizacion: number;
  idNuevoRol: number;
}

export interface GetActividadesPorOrgDto {
  idOrganizacion: number;
}

export interface GetHorariosPorActDto {
  idActividad: number;
}

export interface EliminarActividadDto {
  idUsuarioSolicitante: number;
  idActividad: number;
}

export interface EliminarHorarioDto {
  idUsuarioSolicitante: number;
  idHorarioActividad: number;
}

export interface ActividadCreacionIntegracionDto {
  idUsuarioSolicitante: number;
  actividad: {
    idOrganizacion: number;
    idCategoria: number;
    idUbicacion: number;
    nombre: string;
    descripcion: string;
    fechaInicio: string; // "YYYY-MM-DDTHH:mm:ss"
    fechaFin: string;
    horas: number;
    cupos: number;
  };
}

export interface HorarioActividadCreateDto {
  idOrganizacion: number;
  idActividad: number;
  idUsuario: number;
  fecha: string; // "YYYY-MM-DDTHH:mm:ss"
  horaInicio: string;
  horaFin: string;
  descripcion?: string;
  situacion: 'I' | 'P' | 'C' | 'A' | 'F'; // Inicial, Pendiente, Confirmado, Aprobado, Finalizado
  estado: 'A' | 'I'; // Activo, Inactivo
}

export interface CorrespondenciaOrgDto {
  idTipoCorrespondencia: number;
  valor: string;
  consentimiento?: 'S' | 'N';
}

export interface UbicacionOrgDto {
  idPais: number;
  idProvincia: number;
  idCanton: number;
  idDistrito: number;
  direccion?: string;
  codigoPostal?: string;
}

export interface OrganizacionCreacionDto {
  idUsuarioCreador: number;
  nombre: string;
  descripcion?: string;
  idUniversidad?: number;
  ubicacion: UbicacionOrgDto;
  correspondencia?: CorrespondenciaOrgDto[];
}

export interface GetByIdDto {
  id: number;
}

export interface UbicacionNestedDto {
  idUbicacion: number;
  idPais: number;
  idProvincia: number;
  idCanton: number;
  idDistrito: number;
  direccion: string;
}

export interface OrganizacionNestedDto {
  idOrganizacion: number;
  nombre: string;
  descripcion: string;
  idUniversidad: number;
}

export interface ActualizarOrganizacionDto {
  idUsuarioSolicitante: number;
  organizacion: OrganizacionNestedDto;
  ubicacion: UbicacionNestedDto;
}

// --- Interfaces de Respuesta del API (crudas) ---

export interface RolUsuarioApi {
  idRol: number;
  nombreRol: string;
  esAdmin: string; // 'true' o 'false'
}

export interface OrganizacionConEstadoApi {
  idOrganizacion: number;
  nombre: string;
  descripcion?: string;
  rolesUsuario: RolUsuarioApi[] | null;
}

export interface UsuarioDeOrganizacionApi {
  idRolUsuarioOrganizacion: number;
  idUsuario: number;
  username: string;
  nombre?: string;
  apellidoP?: string;
  apellidoM?: string;
  idRol: number;
  nombreRol: string;
  esActivo: string; // 'A' o 'I'
}

// --- Interfaces Normalizadas (para uso en componentes) ---

export interface RolUsuario {
  idRol: number;
  nombreRol: string;
  isAdmin: boolean;
}

export interface OrganizacionConEstado {
  idOrganizacion: number;
  nombre: string;
  descripcion?: string;
  rolesUsuario: RolUsuario[] | null;
}

export interface UsuarioDeOrganizacion {
  idRolUsuarioOrganizacion: number;
  idUsuario: number;
  username: string;
  nombre?: string;
  apellidoP?: string;
  apellidoM?: string;
  idRol: number;
  nombreRol: string;
  isActivo: boolean;
}

export interface ActividadRow {
  idActividad: number;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  horas: number;
  cupos: number;
  situacion?: string;
}

export interface HorarioRow {
  idHorarioActividad: number;
  idActividad: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion?: string;
  situacion: string;
  estado: string;
}

export interface CategoriaActividad {
  idCategoria: number;
  nombre: string;
  descripcion?: string;
}

// --- Respuestas genéricas del API ---

export interface ApiMensajeAdmin {
  mensaje: string;
  codigoError?: number;
  id?: number; // Para respuestas de creación
}

// --- Funciones de normalización ---

export function normalizarRolUsuario(api: RolUsuarioApi): RolUsuario {
  return {
    idRol: api.idRol,
    nombreRol: api.nombreRol,
    isAdmin: api.esAdmin === 'true',
  };
}

export function normalizarOrganizacion(api: OrganizacionConEstadoApi): OrganizacionConEstado {
  return {
    idOrganizacion: api.idOrganizacion,
    nombre: api.nombre,
    descripcion: api.descripcion,
    rolesUsuario: api.rolesUsuario ? api.rolesUsuario.map(normalizarRolUsuario) : null,
  };
}

export function normalizarUsuario(api: UsuarioDeOrganizacionApi): UsuarioDeOrganizacion {
  return {
    idRolUsuarioOrganizacion: api.idRolUsuarioOrganizacion,
    idUsuario: api.idUsuario,
    username: api.username,
    nombre: api.nombre,
    apellidoP: api.apellidoP,
    apellidoM: api.apellidoM,
    idRol: api.idRol,
    nombreRol: api.nombreRol,
    isActivo: api.esActivo === 'A',
  };
}

