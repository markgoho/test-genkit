import { Component, resource, signal } from '@angular/core';
import { MenuItem } from './output-schema/menu-item.schema';
import { runFlow } from 'genkit/beta/client';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';

@Component({
  imports: [FormsModule, JsonPipe],
  template: `<h3>Structured menu item</h3>
    <input type="text" [(ngModel)]="structuredMenuInput" />
    <button (click)="this.structuredMenuTheme.set(structuredMenuInput)">
      Generate
    </button>
    @if (structuredMenuResource.isLoading()) {
      Loading...
    } @else {
      <pre>{{ structuredMenuResource.value() | json }}</pre>
    }`,
})
export class StructuredOutputComponent {
  structuredMenuInput = '';
  structuredMenuTheme = signal('');
  structuredMenuResource = resource({
    request: () => this.structuredMenuTheme(),
    loader: ({ request }) =>
      runFlow<MenuItem>({
        url: 'structured-menu',
        input: request,
      }),
  });
}
