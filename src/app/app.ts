import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, inject, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';

import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { Menu } from './layout/menu/menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Header, Menu, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly sidenav = viewChild.required(MatSidenav);

  /** En pantallas chicas el menú es un panel que se superpone y se cierra al navegar. */
  protected readonly esMovil = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((estado) => estado.matches)),
    { initialValue: false },
  );

  protected alternarMenu(): void {
    this.sidenav().toggle();
  }

  protected alNavegar(): void {
    if (this.esMovil()) {
      this.sidenav().close();
    }
  }
}
