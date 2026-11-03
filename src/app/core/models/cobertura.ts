/** Cobertura médica activa, tal como la devuelve GET /coberturas. */
export interface Cobertura {
  id: number;
  nombre: string;
}

export type CoberturaRequest = Omit<Cobertura, 'id'>;
