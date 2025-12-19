import { TipoIdentificador } from './reference-data.dto';

export interface UniversidadDto {
  idUniversidad: number;
  nombre: string;
  siglas: string;
  estado: string; // char en backend
}

/**
 * DTO equivalente a `PerfilDetalleDto` del backend.
 * Nota: el backend puede serializar en camelCase o PascalCase; en la UI normalizamos ambas.
 */
export interface PerfilDetalleDto {
  idPerfil: number;
  idUsuario: number;
  idUbicacion: number;
  idIdentificador: number;
  idUniversidad?: number | null;

  identificacion: string;
  nombre: string;
  apellidoP: string;
  apellidoM?: string | null;
  fechaNacimiento: string; // ISO date
  carrera?: string | null;
  bibliografia?: string | null;
  estado: string; // char en backend (A/I)

  // Opcional: si el backend hidrata relaciones
  universidad?: UniversidadDto | null;
  idIdentificadorNavigation?: TipoIdentificador | null;
  // Ubicación no está tipada aún en reference-data.dto.ts; si llega, lo leemos como unknown en el view.
  idUbicacionNavigation?: unknown;
}


