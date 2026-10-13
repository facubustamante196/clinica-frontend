import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Footer } from './layout/footer/footer';
import { Header } from './layout/header/header';
import { Menu } from './layout/menu/menu';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Menu, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
