import { Component, resource, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { runFlow } from 'genkit/beta/client';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent {
  menuInput = '';
  theme = signal('');

  menuResource = resource({
    request: () => this.theme(),
    loader: ({request}) => runFlow<string>({ url: 'menu', input: request })
  });
}