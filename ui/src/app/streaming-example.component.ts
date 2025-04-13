import {
  Component,
  resource,
  ResourceRef,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { streamFlow } from 'genkit/beta/client';
import { ResourceLoaderParams } from '@angular/core';
import { GameCharacters } from './output-schema/menu-item.schema';

type StreamItem = { value: GameCharacters };

@Component({
  imports: [FormsModule],
  standalone: true,
  selector: 'app-streaming-example',
  template: `
    <h2>Stream JSON from LLM</h2>
    This is a Game Character Generator.<br />
    How many game characters do you need?
    <input type="number" [(ngModel)]="count" />
    <button (click)="this.characterCount.set(count)">Generate</button>

    @let characters = gameCharactersResource.value(); @for (character of
    characters; track character.name) {
    <h2>{{ character.name }}</h2>
    <p>{{ character.description }}</p>
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

      this.processCharacterStream(gameCharacters, count);

      abortSignal.addEventListener('abort', () => {
        console.log('Stream aborted, cleanup if necessary');
        // Add any necessary cleanup logic here, e.g., closing connections
      });

      // Return the signal synchronously
      return gameCharacters;
    },
    defaultValue: [],
  });

  private async processCharacterStream(
    signalToUpdate: WritableSignal<StreamItem>,
    count: number
  ) {
    try {
      const { stream } = streamFlow<string, GameCharacters>({
        url: '/flows/streamCharacters',
        input: count,
      });

      for await (const chunk of stream) {
        signalToUpdate.set({ value: chunk });
      }
    } catch (err: unknown) {
      console.error('Stream error:', err);
      // signalToUpdate.set({ error: err });
    }
  }
}
