import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'basic',
    loadComponent: () => import('./basic-example.component').then((m) => m.BasicExampleComponent),
  },
  {
    path: 'structured',
    loadComponent: () => import('./structured-output.component').then((m) => m.StructuredOutputComponent),
  },
  {
    path: 'streaming',
    loadComponent: () => import('./streaming-example.component').then((m) => m.StreamingExampleComponent),
  },
  {
    path: 'simple-chatbot',
    loadComponent: () => import('./simple-chatbot.component').then((m) => m.SimpleChatbotComponent),
  },
  {
    path: 'chatbot-with-tools',
    loadComponent: () => import('./chatbot-with-tools.component').then((m) => m.ChatbotWithToolsComponent),
  },
  {
    path: 'chatbot-with-tool-responses',
    loadComponent: () =>
      import('./chatbot-with-tool-responses.component').then((m) => m.ChatbotWithToolResponsesComponent),
  },
  {
    path: '**',
    redirectTo: 'basic',
  },
];
