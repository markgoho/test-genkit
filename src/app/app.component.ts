import { Component, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { runFlow } from 'genkit/beta/client';
import { MenuItemSchema } from './output-schema/menu-item-schema';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [FormsModule, JsonPipe],
  templateUrl: './app.component.html',
})
export class AppComponent {
  menuInput = '';
  structuredMenuInput = '';
  theme = signal('');
  structuredMenuTheme = signal('');

  menuResource = resource({
    request: () => this.theme(),
    loader: ({ request }) => runFlow<string>({ url: 'menu', input: request }),
  });

  structuredMenuResource = resource({
    request: () => this.structuredMenuTheme(),
    loader: ({ request }) =>
      runFlow<typeof MenuItemSchema>({
        url: 'structured-menu',
        input: request,
      }),
  });
}
