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
  id_identificador: number;
  identificacion: string;
  nombre: string;
  apellido_p: string;
  apellido_m?: string | null;
  fecha_nacimiento: string; // Formato YYYY-MM-DD
  id_universidad?: number | null;
  carrera?: string | null;
  bibliografia?: string | null;
}

export interface UbicacionRegDto {
  id_pais: number;
  id_provincia: number;
  id_canton: number;
  id_distrito: number;
  direccion?: string | null;
  codigo_postal?: string | null;
  latitud?: number | null;
  longitud?: number | null;
}

export interface CorrespondenciaRegDto {
  id_tipo_correspondencia: number;
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

