import { Observable } from 'rxjs';

/** Campo de texto del formulario de alta y modificación. */
export interface CampoCatalogo<T> {
  nombre: Exclude<keyof T, 'id'> & string;
  etiqueta: string;
  /** Mismo límite que valida el backend. */
  maxLength: number;
  /** Patrón opcional, con el mensaje que se muestra si no se cumple. */
  patron?: RegExp;
  mensajePatron?: string;
}

/**
 * Configuración de una pantalla de ABM simple (sedes, especialidades, coberturas).
 * Cada campo se muestra también como columna de la tabla.
 */
export interface ConfigCatalogo<T extends { id: number }> {
  /** Título de la pantalla, en plural (ej: "Sedes"). */
  titulo: string;
  /** Títulos del formulario (ej: "Nueva sede" / "Editar sede"). */
  tituloAlta: string;
  tituloEdicion: string;
  campos: CampoCatalogo<T>[];
  /** Cómo nombrar un ítem en mensajes (ej: `la sede "Centro"`). */
  describir: (item: T) => string;
  listar: () => Observable<T[]>;
  crear: (datos: Omit<T, 'id'>) => Observable<unknown>;
  modificar: (id: number, datos: Omit<T, 'id'>) => Observable<unknown>;
  eliminar: (id: number) => Observable<unknown>;
}
