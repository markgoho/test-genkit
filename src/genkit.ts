import { gemini20Flash, googleAI } from '@genkit-ai/googleai';
import { genkit, MessageData } from 'genkit';
import { z } from '@genkit-ai/core';
import {
  GameCharactersSchema,
  MenuItemSchema,
} from './app/output-schema/menu-item.schema';
import { parse, Allow } from 'partial-json';
import { HistoryStore } from './agent';
import { defineAgent } from './agent';

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
      `Invent a menu item for a ${restaurantTheme} themed restaurant.`,
    );
    return text;
  },
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
  },
);

export const streamCharacters = ai.defineFlow(
  {
    name: 'streamCharacters',
    inputSchema: z.number(),
    outputSchema: z.string(),
    streamSchema: GameCharactersSchema,
  },
  async (count, { sendChunk }) => {
    const { response, stream } = await ai.generateStream({
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
      buffer += chunk.content[0].text!;
      if (buffer.length > 10) {
        sendChunk(parse(maybeStripMarkdown(buffer), Allow.ALL));
      }
    }
    return (await response).text;
  },
);

const markdownRegex = /^\s*(```json)?((.|\n)*?)(```)?\s*$/i;
function maybeStripMarkdown(withMarkdown: string) {
  const mdMatch = markdownRegex.exec(withMarkdown);
  if (!mdMatch) {
    return withMarkdown;
  }
  return mdMatch[2];
}

const weatherTool = ai.defineTool(
  {
    name: 'weatherTool',
    description: 'use this tool to display weather',
    inputSchema: z.object({
      date: z
        .string()
        .describe('date (use datePicker tool if user did not specify)'),
      location: z.string().describe('location (ZIP, city, etc.)'),
    }),
    outputSchema: z.string().optional(),
  },
  async () => undefined,
);

const datePicker = ai.defineTool(
  {
    name: 'datePicker',
    description:
      'user can use this UI tool to enter a date (prefer this over asking the user to enter the date manually)',
    inputSchema: z.object({
      ignore: z.string().describe('ignore this (set to undefined)').optional(),
    }),
    outputSchema: z.string().optional(),
  },
  async () => undefined,
);

export const chatbotFlow = defineAgent(ai, {
  name: 'chatbotFlow',
  model: gemini20Flash,
  tools: [weatherTool, datePicker],
  returnToolRequests: true,
  systemPrompt:
    'You are a helpful agent. You have the personality of Agent Smith from Matrix. ' +
    'There are tools/functions at your disposal, ' +
    'feel free to call them. If you think a tool/function can help but you do ' +
    'not have sufficient context make sure to ask clarifying questions.',
  historyStore: inMemoryStore(),
});

const chatHistory: Record<string, MessageData[]> = {};

function inMemoryStore(): HistoryStore {
  return {
    async load(id: string): Promise<MessageData[] | undefined> {
      return chatHistory[id];
    },
    async save(id: string, history: MessageData[]) {
      chatHistory[id] = history;
    },
  };
}
