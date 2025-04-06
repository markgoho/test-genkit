import {
  Component,
  resource,
  ResourceRef,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';
import { ResourceLoaderParams, ResourceStreamItem } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { GameCharacters } from './output-schema/menu-item.schema';

type StreamItem = { value: GameCharacters };
type StreamItemSignal = WritableSignal<StreamItem>;

@Component({
  imports: [FormsModule, JsonPipe],
  standalone: true,
  selector: 'app-streaming-example',
  template: `
    <h3>Stream JSON from LLM</h3>
    This is a Game Character Generator.<br />
    How many game characters do you need?
    <input type="number" [(ngModel)]="count" />
    <button (click)="this.characterCount.set(count)">Generate</button>

    @let characters = gameCharactersResource.value();

    @for (character of characters; track character.name) {
      {{ character | json }}
    }
  `,
  styles: [
    `
      .characters {
        margin-top: 20px;
      }
    `,
  ],
})
export class StreamingExampleComponent {
  count: string = '3';
  error?: string = undefined;
  loading: boolean = false;

  characterCount = signal('3');

  gameCharactersResource: ResourceRef<GameCharacters> = resource<
    GameCharacters,
    string
  >({
    request: () => this.characterCount(),
    stream: async ({
      request,
      abortSignal,
    }: ResourceLoaderParams<string>): Promise<WritableSignal<StreamItem>> => {
      const count = parseInt(request);
      const gameCharacters = signal<StreamItem>({ value: [] });

      const { stream } = streamFlow<GameCharacters>({
        url: 'stream-characters',
        input: count,
      });
      (async () => {
        try {
          for await (const chunk of stream) {
            console.log('Received chunk:', JSON.stringify(chunk, null, 2));
            // Update the signal with the latest full chunk (assuming chunk is GameCharacters)
            gameCharacters.set({ value: chunk });
          }
        } catch (err) {
          console.error('Stream error:', err);
          // Optionally update the signal with an error state
          // gameCharacters.set({ error: err });
        }
      })();

      abortSignal.addEventListener('abort', () => {
        console.log('Stream aborted, cleanup if necessary');
        // Add any necessary cleanup logic here, e.g., closing connections
      });

      // Return the signal synchronously
      return gameCharacters;
    },
    defaultValue: [],
  });
}
