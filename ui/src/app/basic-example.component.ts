import { Component, resource, signal } from '@angular/core';
import { runFlow } from 'genkit/beta/client';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  template: `<h3>Generate a custom menu item</h3>
    <input type="text" [(ngModel)]="menuInput" />
    <button (click)="this.theme.set(menuInput)">Generate</button>
    <br />
    @if (menuResource.isLoading()) {
      Loading...
    } @else {
      <pre>{{ menuResource.value() }}</pre>
    }`,
})
export class BasicExampleComponent {
  menuInput = '';
  theme = signal('');

  menuResource = resource({
    request: () => this.theme(),
    loader: ({ request }) =>
      runFlow<string>({
        url: '/flows/menu',
        input: request,
      }),
  });
}
