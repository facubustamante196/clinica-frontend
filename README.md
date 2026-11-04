# Clínica — Frontend

Frontend de la clínica virtual en Angular 21 + Angular Material 21 (componentes standalone, sin SSR).
Consume la API de [`clinica-backend`](../clinica-backend).

## Versiones

Tomadas de `node -v` y `ng version`:

| Herramienta | Versión |
|---|---|
| Node.js | 22.23.2 (soportadas: ^20.19, ^22.12 o ^24) |
| npm | 10.9.8 |
| Angular CLI | 21.2.26 |
| Angular | 21.2.25 |
| Angular Material / CDK | 21.2.14 |
| TypeScript | 5.9.3 |
| Chart.js | 4.6.1 |
| ng2-charts | 10.0.0 |

### Librería de gráficos

Los reportes del administrador usan **[Chart.js](https://www.chartjs.org/) 4** a través de
**[ng2-charts](https://valor-software.com/ng2-charts/) 10**, compatible con Angular 21 y componentes
standalone. Se instalan con `npm install` (están en `package.json`); no hace falta configuración extra.

- Turnos por especialidad: gráfico de barras.
- Turnos por sede: gráfico de torta.

Los gráficos se registran solo en la pantalla de reportes (`provideCharts(withDefaultRegisterables())`
en `reportes.ts`), así que Chart.js no se carga en el resto de la app.

## Instalación

Requiere el Angular CLI 21 instalado globalmente:

```bash
npm install -g @angular/cli@21
```

Después, en la carpeta del proyecto:

```bash
npm install
```

> Si `npm install` falla con `Cannot read properties of null (reading 'edgesOut')`, es un bug de
> npm 10 al resolver las dependencias de `vitest`. Pasa si se borró `package-lock.json`: restauralo
> desde git, o generalo una vez con `npx npm@11 install`.

## Levantar

Con el backend corriendo en `http://localhost:3001`:

```bash
ng serve
```

La app queda en `http://localhost:4200`.

Otros comandos:

```bash
ng build   # compilación de producción en dist/
ng test    # tests unitarios (Vitest)
```

## URL del backend

Se configura en un único lugar, `src/environments/`:

- `environment.development.ts`: la usa `ng serve`.
- `environment.ts`: la usa `ng build` (producción).

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
};
```

Ningún servicio repite la URL: todos arman sus rutas a partir de `environment.apiUrl`.

## Estructura de carpetas

```
src/
├── environments/              # URL de la API por entorno
└── app/
    ├── app.config.ts          # providers: router, HttpClient + interceptor, restauración de sesión
    ├── app.routes.ts          # rutas públicas, con sesión, por rol y de estado
    ├── core/
    │   ├── guards/            # authGuard, roleGuard
    │   ├── interceptors/      # authInterceptor (Bearer + 401), errorInterceptor (backend caído o error)
    │   ├── models/            # interfaces de la API (usuarios, turnos, sedes, auditoría, reportes...)
    │   ├── services/          # un servicio por recurso de la API (auth, usuarios, turnos, sedes...)
    │   └── utils/             # fechas, mensajes de error y validadores de formularios
    ├── layout/                # header (con la campana de notificaciones), menu, footer
    ├── pages/
    │   ├── admin/             # coberturas, sedes, especialidades, usuarios, reportes, auditoria
    │   ├── medico/            # medico.routes.ts (sección /medico)
    │   ├── operador/          # operador.routes.ts (sección /operador)
    │   ├── paciente/          # mis-turnos, mis-datos
    │   ├── home/  login/  perfil/  registro/
    │   └── acceso-denegado/  en-construccion/  no-encontrada/
    └── shared/                # reutilizables: ABM genérico, alta de paciente, diálogo de
                               # confirmación, carga, sin resultados, pipe de fecha
```

## Sesión y acceso

- `AuthService` expone `usuario` (signal), `rol` y `estaLogueado` (computed), y los métodos
  `login(dni, password)`, `logout()`, `obtenerPerfil()`, `registrar(datos)` y
  `actualizarPerfil(cambios)` (datos personales del paciente).
- El JWT se guarda en `localStorage` (`clinica_token`). Al recargar, la sesión se restaura con
  `GET /auth/perfil` antes de la primera navegación.
- `authInterceptor` agrega `Authorization: Bearer <token>` a las peticiones a la API. Ante un 401,
  cierra la sesión y redirige a `/login`.
- Rutas:

| Ruta | Acceso |
|---|---|
| `/`, `/login`, `/registro` | Públicas |
| `/perfil` | Con sesión |
| `/admin/...` | Rol `admin` |
| `/medico/...` | Rol `medico` |
| `/operador/...` | Rol `operador` |
| `/paciente/...` | Rol `paciente` |
| `/acceso-denegado` | Sin permiso para la sección |
| cualquier otra | Página no encontrada |

## Pantallas

### Administrador

| Ruta | Pantalla | Endpoints que usa |
|---|---|---|
| `/admin/coberturas` | ABM de coberturas con filtro y baja confirmada | `GET/POST/PUT/DELETE /coberturas` |
| `/admin/sedes` | ABM de sedes | `GET/POST/PUT/DELETE /sedes` |
| `/admin/especialidades` | ABM de especialidades | `GET/POST/PUT/DELETE /especialidades` |
| `/admin/usuarios` | Listado paginado con filtros por nombre, apellido, tipo y sede; alta de operador, médico y administrador; edición de cualquier usuario, incluidas las especialidades del médico | `GET /usuarios`, `GET /usuarios/:id`, `POST /usuarios`, `PUT /usuarios/:id`, `GET /sedes`, `GET /especialidades`, `GET /coberturas` |
| `/admin/reportes` | Dashboard con filtro por rango de fechas y gráficos | `GET /reportes/turnos-por-especialidad`, `/turnos-por-sede`, `/ranking-medicos` y `/tasa-cancelacion` |
| `/admin/auditoria` | Registros de solo lectura con filtros y paginación | `GET /auditoria` |

En la gestión de usuarios:

- El operador y el médico tienen sede; el administrador no. El médico recibe además sus especialidades.
- Los pacientes no se dan de alta desde acá: se registran solos o los da de alta un operador.
- El rol de un usuario no se puede modificar. En la edición, la contraseña es opcional: si queda
  vacía, no cambia.
- La paginación es del lado del servidor (`pagina` y `limite`, hasta 50 por página).

### Paciente

| Ruta | Pantalla | Endpoints que usa |
|---|---|---|
| `/paciente/turnos` | Mis turnos: próximos primero, estado, cancelación e historial clínico de los atendidos | `GET /turnos/mios`, `PATCH /turnos/:id/cancelar`, `GET /historial` |
| `/paciente/datos` | Mis datos personales: solo se modifican email, teléfono, cobertura y contraseña | `GET /auth/perfil`, `PATCH /auth/perfil`, `GET /coberturas` |

En Mis datos, el resto de la información se muestra en modo lectura. Solo se envían los campos que
cambiaron, y la contraseña nueva se pide dos veces y se valida que coincida antes de enviar.

### Todos los roles

- `/perfil`: datos del usuario logueado.
- Campana de notificaciones en el header (`GET /notificaciones`, `PATCH /notificaciones/:id/leida`):
  muestra las no leídas y se refresca después de confirmar, cancelar o atender un turno.
