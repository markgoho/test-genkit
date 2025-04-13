import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from 'zod';
import { parse, Allow } from 'partial-json';
import { GameCharactersSchema, MenuItemSchema } from './flows/menu-item.schema';

export const ai = genkit({
  plugins: [googleAI()],
  model: gemini20Flash,
});

export const menuSuggestionFlow = ai.defineFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (restaurantTheme) => {
    const { text } = await ai.generate(
      `Invent a menu item for a ${restaurantTheme} themed restaurant.`
    );
    return text;
  }
);

export const structuredMenuSuggestionFlow = ai.defineFlow(
  {
    name: 'structuredMenuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: MenuItemSchema,
  },
  async (restaurantTheme: string) => {
    const { output } = await ai.generate({
      prompt: `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
      output: { schema: MenuItemSchema },
    });

    if (output == null) {
      throw new Error('No output from Genkit');
    }

    return output;
  }
);

export const streamCharacters = ai.defineFlow(
  {
    name: 'streamCharacters',
    inputSchema: z.number(),
    outputSchema: z.string(),
    streamSchema: GameCharactersSchema,
  },
  async (count, { sendChunk }) => {
    const { response, stream } = ai.generateStream({
      model: gemini20Flash,
      output: {
        format: 'json',
        schema: GameCharactersSchema,
      },
      config: {
        temperature: 1,
      },
      prompt: `Respond as JSON only. Generate ${count} different RPG game characters.`,
    });

    let buffer = '';
    for await (const chunk of stream) {
      buffer += chunk.content[0]?.text ?? '';
      if (buffer.length > 10) {
        const stripped = maybeStripMarkdown(buffer);
        if (typeof stripped === 'string') {
          sendChunk(parse(stripped, Allow.ALL));
        }
      }
    }
    return (await response).text ?? '';
  }
);

const markdownRegex = /^\s*(```json)?((.|\n)*?)(```)?\s*$/i;
function maybeStripMarkdown(withMarkdown: string): string | undefined {
  const mdMatch = markdownRegex.exec(withMarkdown);
  if (!mdMatch) {
    return withMarkdown;
  }
  return mdMatch[2];
}
