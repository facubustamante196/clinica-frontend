import { HttpParams } from '@angular/common/http';

/** Arma los query params omitiendo los que no tienen valor (undefined, null o texto vacío). */
export function armarParametros(filtros: object): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor !== undefined && valor !== null && valor !== '') {
      params = params.set(clave, String(valor));
    }
  }
  return params;
}
