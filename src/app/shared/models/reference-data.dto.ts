// DTOs para datos de referencia

export interface Pais {
  idPais: number;
  nombre: string;
  estado?: string;
}

export interface Provincia {
  idProvincia: number;
  idPais: number;
  nombre: string;
  estado?: string;
}

export interface Canton {
  idCanton: number;
  idProvincia: number;
  idPais: number;
  nombre: string;
  estado?: string;
}

export interface Distrito {
  idDistrito: number;
  idCanton: number;
  idProvincia: number;
  idPais: number;
  nombre: string;
  estado?: string;
}

export interface TipoCorrespondencia {
  idTipoCorrespondencia: number;
  descripcion: string;
  estado?: string;
}

export interface TipoIdentificador {
  idTipoIdentificador: number;
  descripcion: string;
  estado?: string;
}

export interface Universidad {
  idUniversidad: number;
  nombre: string;
  siglas?: string;
  estado?: string;
}

