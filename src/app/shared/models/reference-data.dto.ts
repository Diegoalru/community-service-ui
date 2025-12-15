// DTOs para datos de referencia

export interface Pais {
  idPais: number;
  nombre: string;
  codigo?: string;
  estado?: string;
}

export interface Provincia {
  id: number;
  nombre: string;
  codigo?: string;
  estado?: string;
}

export interface Canton {
  id: number;
  nombre: string;
  codigo?: string;
  estado?: string;
}

export interface Distrito {
  id: number;
  nombre: string;
  codigo?: string;
  estado?: string;
}

export interface TipoCorrespondencia {
  idTipoCorrespondencia: number;
  descripcion: string;
  estado?: string;
}

export interface TipoIdentificador {
  idIdentificador: number;
  descripcion: string;
  estado?: string;
}

export interface Universidad {
  idUniversidad: number;
  nombre: string;
  siglas?: string;
  estado?: string;
}

