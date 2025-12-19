// DTOs para autenticación e integración

export interface UsuarioLoginDto {
  username: string;
  password: string;
}

export interface UsuarioRegDto {
  username: string;
  password: string;
}

export interface PerfilRegDto {
  idIdentificador: number;
  identificacion: string;
  nombre: string;
  apellidoP: string;
  apellidoM?: string | null;
  fechaNacimiento: string; // Formato YYYY-MM-DD
  idUniversidad?: number | null;
  carrera?: string | null;
  bibliografia?: string | null;
}

export interface UbicacionRegDto {
  idPais: number;
  idProvincia: number;
  idCanton: number;
  idDistrito: number;
  direccion?: string | null;
  codigoPostal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface CorrespondenciaRegDto {
  idTipoCorrespondencia: number;
  valor: string;
  consentimiento?: 'S' | 'N' | null;
}

export interface RegistroCompletoDto {
  usuario: UsuarioRegDto;
  perfil: PerfilRegDto;
  ubicacion: UbicacionRegDto;
  correspondencia: CorrespondenciaRegDto[];
}

export interface RequestPasswordRecoveryDto {
  username: string;
}

export interface ResetPasswordDto {
  token: string;
  nuevaPassword: string;
}

export interface ChangePasswordDto {
  username: string;
  password: string;
  nuevaPassword: string;
}

export interface ResendActivationDto {
  username: string;
}

export interface ApiMensaje {
  mensaje: string;
  codigoError?: number;
  detalle?: string;
  token?: string;
  idUsuario?: number;
}
