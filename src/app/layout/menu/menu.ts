import { Component, computed, inject, output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Rol } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

interface OpcionMenu {
  etiqueta: string;
  icono: string;
  ruta: string;
}

const OPCIONES_POR_ROL: Record<Rol, OpcionMenu[]> = {
  admin: [
    { etiqueta: 'Coberturas', icono: 'health_and_safety', ruta: '/admin/coberturas' },
    { etiqueta: 'Sedes', icono: 'location_city', ruta: '/admin/sedes' },
    { etiqueta: 'Especialidades', icono: 'medical_services', ruta: '/admin/especialidades' },
    { etiqueta: 'Usuarios', icono: 'group', ruta: '/admin/usuarios' },
    { etiqueta: 'Reportes', icono: 'bar_chart', ruta: '/admin/reportes' },
    { etiqueta: 'Auditoría', icono: 'fact_check', ruta: '/admin/auditoria' },
  ],
  medico: [
    { etiqueta: 'Mi agenda', icono: 'calendar_month', ruta: '/medico/agenda' },
    { etiqueta: 'Turnos', icono: 'event', ruta: '/medico/turnos' },
    { etiqueta: 'Historial clínico', icono: 'folder_shared', ruta: '/medico/historial' },
  ],
  operador: [
    { etiqueta: 'Agendas', icono: 'calendar_month', ruta: '/operador/agendas' },
    { etiqueta: 'Nuevo paciente', icono: 'person_add', ruta: '/operador/pacientes' },
    { etiqueta: 'Asignar turno', icono: 'event_available', ruta: '/operador/turnos' },
  ],
  // El historial clínico se ve dentro de cada turno atendido y las
  // notificaciones, en la campana del header.
  paciente: [
    { etiqueta: 'Nuevo turno', icono: 'event_available', ruta: '/paciente/nuevo-turno' },
    { etiqueta: 'Mis turnos', icono: 'event', ruta: '/paciente/turnos' },
    { etiqueta: 'Mis datos', icono: 'manage_accounts', ruta: '/paciente/datos' },
  ],
};

const OPCIONES_SIN_SESION: OpcionMenu[] = [
  { etiqueta: 'Iniciar sesión', icono: 'login', ruta: '/login' },
  { etiqueta: 'Registrarse', icono: 'person_add', ruta: '/registro' },
];

@Component({
  selector: 'app-menu',
  imports: [MatDividerModule, MatIconModule, MatListModule, RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.scss',
})
export class Menu {
  private readonly auth = inject(AuthService);

  /** Se emite al elegir una opción, para que el contenedor cierre el panel en móvil. */
  readonly navegar = output<void>();

  protected readonly estaLogueado = this.auth.estaLogueado;

  protected readonly opciones = computed<OpcionMenu[]>(() => {
    const rol = this.auth.rol();
    return rol ? OPCIONES_POR_ROL[rol] : OPCIONES_SIN_SESION;
  });
}
