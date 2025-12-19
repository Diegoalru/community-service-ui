export type MisHorasDetalleDto = {
  idOrganizacion: number;
  idActividad: number;
  actividad: string;
  fecha: string;
  horas: number;
};

export type MisHorasDto = {
  horasTotales: number;
  actividades: number;
  ultimaParticipacion: string | null;
  desglose: MisHorasDetalleDto[];
};


