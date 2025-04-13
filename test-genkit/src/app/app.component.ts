import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  template: ` <h1>Genkit Examples</h1>
    <nav>
      <ul>
        <li><a routerLink="/basic">Basic</a></li>
        <li><a routerLink="/structured">Structured</a></li>
        <li><a routerLink="/streaming">Streaming</a></li>
      </ul>
    </nav>
    <router-outlet />`,
})
export class AppComponent {}
