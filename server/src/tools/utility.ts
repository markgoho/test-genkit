import { z } from 'zod';
import { ai } from '../genkit';

export const echoTool = ai.defineTool(
  {
    name: 'echoTool',
    description: 'Echoes the input text back to the user.',
    inputSchema: z.object({
      textToEcho: z.string().describe('The text to be echoed'),
    }),
    outputSchema: z.string().describe('The echoed text'),
  },
  async (input) => {
    return `You said: ${input.textToEcho}`;
  },
);

export const currentTimeTool = ai.defineTool(
  {
    name: 'currentTimeTool',
    description: 'Gets the current time.',
    // Input schema could optionally take a timezone, but let's keep it simple for now
    inputSchema: z.object({}).optional(), // No required input
    outputSchema: z.string().describe('The current date and time'),
  },
  async () => {
    // In a real scenario, you might handle timezones based on input
    return `The current time is ${new Date().toLocaleString()}`;
  },
);
