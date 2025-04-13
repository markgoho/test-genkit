import { Component, signal, WritableSignal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';
import { z } from 'zod';

// --- Re-add the expected stream chunk schemas ---
const TextChunkSchema = z.object({
  // Assuming the flow sends objects matching this structure for text
  // Adjust if the flow actually sends the raw-like {role: model, content: [{text:..}]}
  type: z.literal('text'),
  text: z.string(),
});
const ToolRequestChunkSchema = z.object({
  type: z.literal('tool_request'),
  toolName: z.string(),
  toolInput: z.any(),
});
const ToolResponseChunkSchema = z.object({
  type: z.literal('tool_response'),
  toolName: z.string(),
  toolOutput: z.any(),
});
const ChatStreamSchema = z.union([TextChunkSchema, ToolRequestChunkSchema, ToolResponseChunkSchema]);
type ChatStreamChunk = z.infer<typeof ChatStreamSchema>;
// -------------

// Enhanced message type to store different kinds of info
interface DisplayMessage {
  role: 'user' | 'bot' | 'system';
  content: string; // Main text content
  toolInfo?: string; // Extra info about tool usage
  isThinking?: boolean; // Flag for the "Thinking..." message
}

@Component({
  imports: [FormsModule, CommonModule, MarkdownComponent],
  standalone: true,
  selector: 'app-chatbot-with-tool-responses',
  template: `
    <h2>Chatbot Aware of Tool Responses</h2>
    <p>Ask the assistant bot to roll dice (e.g., "roll 2d6+1")</p>

    <div class="chat-history">
      @for (message of history(); track message; let i = $index) {
        <div class="message" [ngClass]="message.role">
          <strong>{{ getRoleDisplayName(message.role) }}:</strong>
          @if (message.role === 'bot') {
            <markdown [data]="message.content"></markdown>
          } @else {
            <span>{{ message.content }}</span>
          }
          @if (message.toolInfo) {
            <span class="tool-info">{{ message.toolInfo }}</span>
          }
        </div>
      }
      <!-- Removed separate thinking indicator, handled by message.isThinking -->
    </div>

    @if (errorMessage()) {
      <p class="error-message">Error: {{ errorMessage() }}</p>
    }

    <div class="input-area">
      <input
        type="text"
        [(ngModel)]="userMessage"
        placeholder="Type your message..."
        (keyup.enter)="sendMessage()"
        [disabled]="loading()"
      />
      <button (click)="sendMessage()" [disabled]="loading() || !userMessage.trim()">Send</button>
    </div>
  `,
  styles: [
    `
      /* Basic styles - similar to previous components */
      .chat-history {
        height: 300px;
        overflow-y: auto;
        border: 1px solid #ccc;
        margin-bottom: 10px;
        padding: 10px;
        display: flex;
        flex-direction: column;
      }
      .message {
        margin-bottom: 8px;
        padding: 5px 8px;
        border-radius: 4px;
        max-width: 80%;
      }
      .message.user {
        background-color: #e1f5fe;
        align-self: flex-end;
        margin-left: auto;
      }
      .message.bot {
        background-color: #f1f8e9;
        align-self: flex-start;
        margin-right: auto;
      }
      .message.system {
        background-color: #eee;
        align-self: center;
        font-style: italic;
        font-size: 0.9em;
        padding: 3px 6px;
      }
      .message strong {
        margin-right: 5px;
      }
      markdown {
        display: inline;
      }
      .error-message {
        color: red;
        margin-top: 5px;
      }
      .input-area {
        display: flex;
        margin-top: 10px;
      }
      .input-area input {
        flex-grow: 1;
        margin-right: 5px;
      }
      /* Style for tool info */
      .tool-info {
        display: block; /* Put on its own line */
        font-size: 0.8em;
        color: #555;
        margin-top: 3px;
        padding-left: 10px;
        border-left: 2px solid #ccc;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotWithToolResponsesComponent {
  userMessage: string = '';
  history: WritableSignal<DisplayMessage[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  errorMessage: WritableSignal<string | null> = signal(null);

  // Inject ChangeDetectorRef if OnPush causes issues with stream updates
  constructor(private cdr: ChangeDetectorRef) {}

  getRoleDisplayName(role: DisplayMessage['role']): string {
    switch (role) {
      case 'user':
        return 'You';
      case 'bot':
        return 'Dice Bot';
      case 'system':
        return 'System';
    }
  }

  async sendMessage() {
    const messageToSend = this.userMessage.trim();
    if (!messageToSend || this.loading()) return;

    // 1. Add user message
    this.history.update((current) => [...current, { role: 'user', content: messageToSend }]);
    this.loading.set(true);
    this.errorMessage.set(null);
    this.userMessage = '';

    // Outer try block for the entire async operation
    try {
      // Ensure streamFlow uses ChatStreamChunk type
      const flowResult = streamFlow<ChatStreamChunk>({
        url: '/flows/chatbotWithToolResponses',
        input: { message: messageToSend },
      });

      // Inner try...catch...finally for stream iteration
      try {
        for await (const chunk of flowResult.stream) {
          // Use flowResult.stream
          // console.log('Received structured chunk:', chunk);

          this.history.update((current) => {
            const lastMessage = current.length > 0 ? current[current.length - 1] : null;
            switch (chunk.type) {
              case 'text':
                if (lastMessage && lastMessage.role === 'bot') {
                  const updatedMessages = [...current];
                  updatedMessages[current.length - 1] = {
                    ...lastMessage,
                    content: lastMessage.content + chunk.text,
                  };
                  return updatedMessages;
                } else {
                  return [...current, { role: 'bot', content: chunk.text }];
                }
              case 'tool_request':
                return [
                  ...current,
                  {
                    role: 'system',
                    content: `Calling tool: ${chunk.toolName}... 🎲`,
                    toolInfo: `Input: ${JSON.stringify(chunk.toolInput)}`,
                  },
                ];
              case 'tool_response':
                return [
                  ...current,
                  {
                    role: 'system',
                    content: `Tool ${chunk.toolName} finished.`,
                    toolInfo: `Output: ${JSON.stringify(chunk.toolOutput)}`,
                  },
                ];
              default:
                console.warn('Chunk type not handled:', chunk);
                return current;
            }
          });

          this.cdr.detectChanges();
        }
        // Stream loop finished normally
      } catch (err: unknown) {
        // Inner catch: Handles errors DURING stream processing/parsing
        const errorText = err instanceof Error ? err.message : 'An unknown error occurred.';
        if (errorText === 'unkown chunk format: {}') {
          console.warn('[Loop Catch] Stream finished with expected termination chunk format error. Ignoring.');
        } else {
          console.error('[Loop Catch] Flow error during stream processing:', err);
          this.errorMessage.set(errorText);
          this.history.update((current) => {
            const lastIndex = current.length - 1;
            if (lastIndex >= 0 && current[lastIndex].role === 'bot') {
              const updatedMessages = [...current];
              updatedMessages[lastIndex] = { ...current[lastIndex], content: `[Error: ${errorText}]` };
              return updatedMessages;
            }
            return current;
          });
        }
      } finally {
        // Inner finally: Executes after the loop finishes or errors
        this.loading.set(false); // Stop loading indicator
        this.cdr.detectChanges();
      }

      // Attach catch handler to the OUTPUT promise for final state/errors
      flowResult.output.catch((err: unknown) => {
        const errorText = err instanceof Error ? err.message : 'An unknown final error occurred.';
        // This check handles the rejection caused by the final empty chunk
        if (errorText === 'unkown chunk format: {}') {
          console.warn('[Promise Catch] Flow promise rejected due to expected termination chunk. Ignoring.');
        } else {
          // Handle other reasons the flow promise might reject
          console.error('[Promise Catch] Flow failed:', err);
          // Ensure errorMessage is set if not already handled by inner catch
          if (!this.errorMessage()) {
            this.errorMessage.set(`Flow Error: ${errorText}`);
          }
          // this.loading.set(false); // Remove: Already handled in inner finally block
          this.cdr.detectChanges();
        }
      });
    } catch (initialError: unknown) {
      // Outer catch: Handles errors during setup or streamFlow call
      console.error('[Outer Catch] Error setting up or starting flow:', initialError);
      this.errorMessage.set(initialError instanceof Error ? initialError.message : 'Failed to start flow');
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }
}
