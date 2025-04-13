import { Component, signal, WritableSignal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';
import { CommonModule } from '@angular/common';
import { MarkdownComponent } from 'ngx-markdown';

// Type for individual chat messages
interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

@Component({
  imports: [FormsModule, CommonModule, MarkdownComponent],
  standalone: true,
  selector: 'app-simple-chatbot',
  template: `
    <h2>Simple Chatbot</h2>
    <p>Talk to the pirate bot:</p>

    <!-- Chat History Display -->
    <div class="chat-history">
      @for (message of history(); track message; let i = $index) {
        <div class="message" [ngClass]="message.role">
          <strong>{{ message.role === 'user' ? 'You' : 'Pirate Bot' }}:</strong>
          <!-- Use the markdown component -->
          @if (message.role === 'bot') {
            <markdown [data]="message.content"></markdown>
          } @else {
            <span>{{ message.content }}</span>
          }
        </div>
      }
      @if (loading()) {
        <div class="message bot">
          <strong>Pirate Bot:</strong>
          <span>Thinking...</span>
        </div>
      }
    </div>

    @if (errorMessage()) {
      <p class="error-message">Error: {{ errorMessage() }}</p>
    }

    <!-- Input Area -->
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
        background-color: #e1f5fe; /* Light blue for user */
        align-self: flex-end;
        margin-left: auto; /* Push user messages to the right */
      }
      .message.bot {
        background-color: #f1f8e9; /* Light green for bot */
        align-self: flex-start;
        margin-right: auto; /* Keep bot messages to the left */
      }
      .message strong {
        margin-right: 5px;
      }
      /* Ensure markdown content fits */
      markdown {
        display: inline; /* Or block depending on desired layout */
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
    `,
  ],
  // Use OnPush for potentially better performance with signal updates
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimpleChatbotComponent {
  userMessage: string = '';

  // State Signals
  history: WritableSignal<ChatMessage[]> = signal([]);
  loading: WritableSignal<boolean> = signal(false);
  errorMessage: WritableSignal<string | null> = signal(null);

  async sendMessage() {
    const messageToSend = this.userMessage.trim();
    if (!messageToSend || this.loading()) {
      return;
    }

    // 1. Add user message to history
    this.history.update((current) => [...current, { role: 'user', content: messageToSend }]);

    // 2. Add bot placeholder & start loading
    this.loading.set(true);
    this.errorMessage.set(null);
    this.userMessage = ''; // Clear input field

    try {
      this.history.update((current) => [
        ...current,
        { role: 'bot', content: '' }, // Start with empty content
      ]);
      const botMessageIndex = this.history().length - 1;

      const { stream } = streamFlow<string>({
        url: '/flows/simpleChatbot',
        input: { message: messageToSend },
      });

      for await (const chunk of stream) {
        this.history.update((current) => {
          const botMessage = current[botMessageIndex];
          if (botMessage && botMessage.role === 'bot') {
            const updatedMessages = [...current];
            updatedMessages[botMessageIndex] = {
              ...botMessage,
              content: botMessage.content + chunk,
            };
            return updatedMessages;
          }
          return current;
        });
      }
      // Stream completed without throwing during the loop
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'An unknown error occurred.';

      // Check if it's the specific termination chunk error
      if (errorText === 'unkown chunk format: {}') {
        console.warn('Stream finished with expected termination chunk format error. Ignoring.');
        // Treat as success, don't set error message or update history further
      } else {
        // Handle actual errors
        console.error('Flow error:', err);
        this.errorMessage.set(errorText);
        this.history.update((current) => {
          const lastIndex = current.length - 1;
          if (lastIndex >= 0 && current[lastIndex].role === 'bot') {
            const updatedMessages = [...current];
            updatedMessages[lastIndex] = {
              ...current[lastIndex],
              content: `[Error: ${errorText}]`,
            };
            return updatedMessages;
          }
          return current;
        });
      }
    } finally {
      this.loading.set(false);
    }
  }
}
