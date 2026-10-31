import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './core/layout/navbar/navbar.component';
import { CartDrawerComponent } from './features/cart/cart-drawer/cart-drawer.component';

@Component({
  imports: [RouterOutlet, NavbarComponent, CartDrawerComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('Edelyx_Ecommer');
}
