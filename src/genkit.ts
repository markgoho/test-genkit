import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';
import { z } from '@genkit-ai/core';
import { MenuItemSchema } from './app/output-schema/menu-item-schema';

const ai = genkit({
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
