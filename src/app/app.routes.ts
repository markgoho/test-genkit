import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'basic',
    loadComponent: () =>
      import('./basic-example.component').then((m) => m.BasicExampleComponent),
  },
  {
    path: 'structured',
    loadComponent: () =>
      import('./structured-output.component').then(
        (m) => m.StructuredOutputComponent,
      ),
  },
  {
    path: 'chat',
    loadComponent: () =>
      import('./chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'streaming',
    loadComponent: () =>
      import('./streaming-example.component').then(
        (m) => m.StreamingExampleComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'basic',
  },
];
