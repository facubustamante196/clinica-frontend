import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    password: ['', Validators.required],
  });

  protected readonly cargando = signal(false);
  protected readonly ocultarPassword = signal(true);

  protected ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { dni, password } = this.form.getRawValue();
    this.cargando.set(true);
    this.auth
      .login(dni, password)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (error: unknown) => this.mostrarError(error),
      });
  }

  private mostrarError(error: unknown): void {
    let mensaje = 'No se pudo iniciar sesión. Intentá de nuevo.';
    if (error instanceof HttpErrorResponse) {
      if (error.status === HttpStatusCode.Unauthorized) {
        mensaje = 'DNI o contraseña incorrectos.';
      } else if (error.status === 0) {
        mensaje = 'No se pudo conectar con el servidor. Intentá de nuevo más tarde.';
      } else if (error.error?.mensaje) {
        mensaje = error.error.mensaje;
      }
    }
    this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
  }
}
