/**
 * Modelo según la respuesta del API.
 */
export type ActividadDto = {
  idActividad: number;
  nombre: string;
  descripcion: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  horas: number | null;
  cupos: number;
  situacion: string; // char en backend
  estado: string; // char en backend
};

// Alias para no romper imports existentes
export type EventDto = ActividadDto;

export type EventRow = {
  id: string;
  nombreEvento: string;
  cupo: number;
  hora: string;
  lugar: string;
  duracion: string;
  organizacion: string;
  nombreCoordinador: string;
};