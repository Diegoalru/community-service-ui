/**
 * Modelo según la respuesta del API.
 */
export type OrganizacionBasicaDto = {
  idOrganizacion: number;
  nombre: string;
};

export type UsuarioBasicoDto = {
  idUsuario: number;
  username: string;
};

export type CategoriaActividadBasicaDto = {
  idCategoriaActividad: number;
  nombre: string;
};

export type UbicacionBasicaDto = {
  idUbicacion: number;
  idPais: number;
  idProvincia: number | null;
  idCanton: number | null;
  idDistrito: number | null;
  direccion: string | null;
  codigoPostal: string | null;
  latitud: number | null;
  longitud: number | null;
  estado: string; // char en backend
};

export type HorarioActividadBasicoDto = {
  idHorarioActividad: number;
  idOrganizacion: number;
  idActividad: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string | null;
  situacion: string; // char en backend
  estado: string; // char en backend
};

/**
 * Equivalente a `ActividadDetalleDto` del backend, usando camelCase
 */
export type ActividadDetalleDto = {
  idActividad: number;
  idOrganizacion: number;
  idUsuarioCreador: number;
  idCategoria: number;
  idUbicacion: number;

  nombre: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  horas: number | null;
  cupos: number;
  situacion: string; // char en backend
  estado: string; // char en backend

  // Nuevo atributo desde el endpoint: si el usuario (consultado) ya está inscrito.
  usuarioInscrito?: boolean;

  organizacion: OrganizacionBasicaDto;
  usuarioCreador: UsuarioBasicoDto;
  categoria: CategoriaActividadBasicaDto;
  ubicacion: UbicacionBasicaDto;
  horarios: HorarioActividadBasicoDto[];
};

// Alias para mantener el nombre usado en el front
export type ActividadDto = ActividadDetalleDto;

// Alias para no romper imports existentes
export type EventDto = ActividadDto;

export type InscribirUsuarioActividadRequestDto = {
  idUsuario: number;
  idOrganizacion: number;
  idActividad: number;
  idHorarioActividad: number;
};

export type InscripcionActividadResponseDto = {
  idParticipanteActividad: number;
  idUsuario: number;
  idOrganizacion: number;
  idActividad: number;
  idHorarioActividad: number;
  fechaInscripcion: string;
  cuposRestantes: number;
};

export type DesinscripcionActividadResponseDto = {
  idUsuario: number;
  idOrganizacion: number;
  idActividad: number;
  idHorarioActividad: number;
  fechaRetiro: string;
  cuposRestantes: number;
};

export type EventRow = {
  id: string;
  idActividad: number;
  idOrganizacion: number;
  idHorarioActividad: number | null;
  usuarioInscrito: boolean;
  nombreEvento: string;
  cupo: number;
  hora: string;
  lugar: string;
  duracion: string;
  organizacion: string;
  nombreCoordinador: string;
};