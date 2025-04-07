import { Component } from '@angular/core';
import {
  FormsModule,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';

interface ToolResponse {
  name: string;
  ref: string;
  output?: unknown;
}

interface InputSchema {
  role: 'user';
  text?: string;
  toolResponse?: ToolResponse;
}

interface ToolRequest {
  name: string;
  ref: string;
  input?: unknown;
}

interface OutputSchema {
  role: 'model';
  text?: string;
  toolRequest?: ToolRequest;
}

@Component({
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent {
  history: (InputSchema | OutputSchema)[] = [];
  error?: string;
  input?: string;
  loading = false;
  id = Date.now() + '' + Math.floor(Math.random() * 1000000000);

  chatFormControl = new FormControl('', [Validators.required]);

  ask(input?: string) {
    const text = this.chatFormControl.value!.trim();
    if (!text) return;
    this.history.push({ role: 'user', text: text });
    this.chatFormControl.setValue('');
    this.chatFormControl.disable();
    this.callFlow({ role: 'user', text });
    this.loading = true;
  }

  async callFlow(input: InputSchema) {
    this.error = undefined;
    this.loading = true;
    try {
      const response = await streamFlow({
        url: '/chatbot',
        input: {
          prompt: input,
          conversationId: this.id,
        },
      });

      let textBlock: OutputSchema | undefined = undefined;
      for await (const chunk of response.stream) {
        for (const content of chunk.content) {
          if (content.text) {
            if (!textBlock) {
              textBlock = { role: 'model', text: content.text! };
              this.history.push(textBlock);
            } else {
              textBlock.text += content.text!;
            }
          }
          if (content.toolRequest) {
            this.history.push({
              role: 'model',
              toolRequest: content.toolRequest,
            });
          }
        }
      }

      this.loading = false;
      this.chatFormControl.enable();
    } catch (e) {
      this.loading = false;
      this.chatFormControl.enable();
      if ((e as any).cause) {
        this.error = `${(e as any).cause}`;
      } else {
        this.error = `${e}`;
      }
    }
  }

  getWeatherLocation(toolRequest: ToolRequest) {
    return (toolRequest.input as any).location;
  }

  datePicked(toolRequest: ToolRequest, event: Date) {
    this.callFlow({
      role: 'user',
      toolResponse: {
        name: toolRequest.name,
        ref: toolRequest.ref,
        output: `${event.toISOString()}`,
      },
    });
  }
}
