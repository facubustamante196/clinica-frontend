# Spec: frontend de Facu para la entrega final

Tareas de frontend que le quedan a Facu según `docs/entrega-final-guia-y-tareas.md` (sección 6, "Facu: Administrador, Paciente y Notificaciones"). Cada tarea se implementa, se prueba y se commitea por separado.

- **Rama:** `entrega-frontend-1`. Al final se integra con lo de Tomás en `entrega-frontend`.
- **Commits:** Conventional Commits, uno por tarea (ver la sección final).
- **Backend:** depende de la spec `clinica-backend/docs/spec-backend-facu.md` (rama `facu-entrega-final`). Las tareas 1 a 4 se pueden escribir con el contrato de esa spec; la 3 y la 5 se prueban cuando estén `POST`/`PUT /usuarios` y `PATCH /auth/perfil`.

### Ya hecho (no entra en esta spec)

- Infraestructura común: interceptores, 401, guards, carga, sin resultados, confirmación, fechas, `environment`.
- ABM de sedes, especialidades y coberturas.
- Auditoría, reportes con gráficos, Mis turnos y notificaciones.
- `form-paciente` como componente reutilizable.

### Lo hace Tomás

- Pantallas de médico y operador (hoy en "En construcción").
- Nombres en `GET /turnos/mios`.

---

## Reglas generales

Aplican a todas las tareas y siguen las convenciones del repo.

- **Capas:** los modelos van en `core/models` (exportados desde `index.ts`), las llamadas HTTP en `core/services` y las pantallas en `pages/<rol>/<pantalla>`. Los componentes no llaman a `HttpClient`.
- **API:** la URL sale de `environment.apiUrl`. Los servicios desenvuelven `ApiRespuesta<T>` y devuelven `datos`.
- **Angular Material** en todas las pantallas. Componentes standalone y signals, como en el resto del proyecto.
- **Estados:** `app-cargando` mientras se espera al backend, `app-sin-resultados` si el listado está vacío y fechas con el pipe dd/mm/aaaa.
- **Errores:** los mensajes del backend (400, 409) se muestran con el helper de `core/utils/mensaje-error.ts`. Los errores inesperados ya los avisa el interceptor.
- **Listados para elegir** (sedes, especialidades, coberturas): siempre desde la API.
- **Formularios:** no se envían si son inválidos. Las validaciones replican las del backend.
- Sin `console.log` ni código comentado sin uso.

### Validaciones de campos de usuario

Iguales a la spec del backend.

| Campo                | Regla                                                         |
| -------------------- | ------------------------------------------------------------- |
| `nombre`, `apellido` | Obligatorio, sin solo espacios, máximo 30 caracteres.         |
| `dni`                | Solo dígitos, de 7 a 8.                                       |
| `email`              | Formato email, máximo 30 caracteres.                          |
| `password`           | Mínimo 6 caracteres.                                          |
| `telefono`           | Solo dígitos, de 6 a 10.                                      |
| `fecha_nacimiento`   | Fecha válida, no posterior a hoy. Se envía como `YYYY-MM-DD`. |

### Reglas por rol

| Rol        | Sede        | Especialidades              | Cobertura                  |
| ---------- | ----------- | --------------------------- | -------------------------- |
| `operador` | Obligatoria | No                          | No                         |
| `medico`   | Obligatoria | Obligatorias (al menos una) | No                         |
| `admin`    | No          | No                          | No                         |
| `paciente` | No          | No                          | Obligatoria (solo edición) |

---

## Tarea 1: modelos y servicio de usuarios

**Modelos** (`core/models/usuario-admin.ts`):

- `Paginado<T>`: `items`, `total`, `pagina`, `limite`, `total_paginas`.
- `UsuarioListado`: un item de `GET /usuarios` (incluye `sede` y `cobertura` como texto o `null`).
- `UsuarioDetalle`: `UsuarioListado` más `especialidades: Especialidad[]`.
- `FiltrosUsuarios`: `nombre`, `apellido`, `rol` e `id_sede`, todos opcionales.
- `RolAlta`: `operador`, `medico` o `admin`. Constante `ROLES_ALTA`.
- `UsuarioAltaRequest`: body de `POST /usuarios`.
- `UsuarioEdicionRequest`: body de `PUT /usuarios/:id` (`password` opcional, sin `rol`).

**Servicio** (`core/services/usuario.service.ts`):

- `listar(filtros, pagina, limite)`: `GET /usuarios`. Los filtros vacíos no se mandan.
- `obtener(id)`: `GET /usuarios/:id`.
- `crear(body)`: `POST /usuarios`.
- `actualizar(id, body)`: `PUT /usuarios/:id`.

**Prueba:** `ng build` compila.

---

## Tarea 2: listado de usuarios

**Pantalla:** `pages/admin/usuarios/`, ruta `admin/usuarios` y opción "Usuarios" en el menú del admin.

- Tabla con nombre y apellido, DNI, email, rol (etiqueta legible), sede y acciones.
- Paginación del lado del servidor con `mat-paginator` (`pagina` y `limite`; tamaños 10, 25 y 50).
- Filtros por nombre y apellido (con debounce), rol y sede (desde `SedeService`). Cambiar un filtro vuelve a la página 1.
- Usa los componentes de carga y sin resultados.

**Prueba:**

- Filtros combinados y cambio de página traen lo esperado.
- Escribir `/admin/usuarios` con otro rol lleva a acceso denegado.

---

## Tarea 3: alta y edición de usuario

**Diálogo** con un formulario reactivo, abierto desde "Nuevo usuario" o desde el lápiz de cada fila.

- **Alta:** el rol se elige entre operador, médico y admin. La contraseña es obligatoria.
- **Edición:** precarga con `obtener(id)`. El rol se muestra pero no se edita. La contraseña es opcional y, si queda vacía, no se manda.
- Los campos de sede, especialidades y cobertura aparecen y se validan según la tabla "Reglas por rol". Al cambiar el rol en el alta, se limpian los que no corresponden.
- Las especialidades usan selección múltiple, cargadas desde `EspecialidadService`.
- El botón de guardar queda deshabilitado mientras el formulario sea inválido o se esté enviando.
- Si el backend responde con error (400 o 409, por ejemplo DNI repetido o especialidad con agenda), el diálogo queda abierto y muestra el mensaje.
- Si sale bien, se cierra, se muestra un aviso y el listado se refresca sin recargar.

**Prueba:**

- Crear un operador, un médico con dos especialidades y un admin.
- Editar un paciente (incluida la cobertura) y las especialidades de un médico.
- Un DNI repetido muestra el mensaje del backend.
- Las altas y las modificaciones aparecen en Auditoría.

---

## Tarea 4: actualizar el perfil en `AuthService`

- Agregar `ActualizarPerfilRequest` (`email`, `password`, `telefono` e `id_cobertura`, todos opcionales) en `core/models/auth.ts`.
- Agregar `actualizarPerfil(cambios)` en `AuthService`: `PATCH /auth/perfil`, que actualiza la signal `usuario` con la respuesta.
- Es un método nuevo en la interfaz acordada: avisarle a Tomás.

**Prueba:** `ng build` compila.

---

## Tarea 5: pantalla Mis datos personales

**Pantalla:** `pages/paciente/mis-datos/`, ruta `paciente/datos` y opción "Mis datos" en el menú del paciente.

- Nombre, apellido, DNI y fecha de nacimiento en modo lectura.
- Formulario con email, teléfono y cobertura (desde `CoberturaService`), precargados.
- Nueva contraseña y repetición, opcionales. Si se carga una, la otra es obligatoria, y un validador de grupo controla que coincidan antes de enviar.
- Solo se envían los campos que cambiaron. Si no cambió nada, el botón queda deshabilitado.
- Los errores del backend (por ejemplo, un email usado) se muestran con su mensaje. Si sale bien, se muestra un aviso y se limpian los campos de contraseña.

**Prueba:**

- Cambiar el teléfono y la cobertura: se ve en la pantalla y en `/perfil`.
- Cambiar la contraseña: el login funciona con la nueva.
- Contraseñas distintas no dejan enviar.

---

## Tarea 6: README

- Librería de gráficos utilizada (ng2-charts y chart.js, con versión).
- Pantallas del administrador y del paciente.
- Mención de los endpoints `/usuarios` y `PATCH /auth/perfil` que usa el frontend.

---

## Tarea 7: cierre

- Probar todo con el backend andando y con el backend apagado: aparece el mensaje y la app no queda en blanco.
- `ng build` sin errores. Sin `console.log`.
- Solo genera un commit si hay que corregir algo.

---

## Commits sugeridos

Uno por tarea, en este orden.

**Spec**

```
git add docs/spec-frontend-facu.md
git commit -m "docs: agregar spec de tareas de frontend de Facu para la entrega final"
```

**Tarea 1**

```
git add src/app/core/models/usuario-admin.ts src/app/core/models/index.ts src/app/core/services/usuario.service.ts
git commit -m "feat(usuarios): agregar modelos y servicio de gestión de usuarios"
```

**Tarea 2**

```
git add src/app/pages/admin/usuarios src/app/pages/admin/admin.routes.ts src/app/layout/menu/menu.ts
git commit -m "feat(usuarios): agregar listado paginado de usuarios con filtros"
```

**Tarea 3**

```
git add src/app/pages/admin/usuarios
git commit -m "feat(usuarios): agregar alta y edición de usuarios con especialidades del médico"
```

**Tarea 4**

```
git add src/app/core/services/auth.service.ts src/app/core/models/auth.ts
git commit -m "feat(perfil): agregar actualización de datos personales en AuthService"
```

**Tarea 5**

```
git add src/app/pages/paciente/mis-datos src/app/pages/paciente/paciente.routes.ts src/app/layout/menu/menu.ts
git commit -m "feat(paciente): agregar pantalla de datos personales editables"
```

**Tarea 6**

```
git add README.md
git commit -m "docs: documentar librería de gráficos y pantallas de administración y paciente"
```
