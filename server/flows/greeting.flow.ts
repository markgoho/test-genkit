// src/index.ts
import * as z from 'zod';
// Revert imports to use the local ai instance
import { ai } from '../genkit';
import { gemini15Flash } from '@genkit-ai/googleai';

// Import the specific model reference you want to use from the configured plugin
// Make sure gemini-1.5-flash-latest is available or choose another appropriate model.

// Define the input schema using Zod
const GreetingRequestSchema = z.object({
  // Expect 'morning', 'afternoon', or 'evening'
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
  // Optional name for personalization
  name: z.string().optional(),
});

// Define the output schema using Zod (just a string)
const GreetingResponseSchema = z.string();

// Tool Input Schema (just the name)
const GreetingToolInputSchema = z.object({
  name: z.string().optional(),
});

// Tool 1: Morning Greeting
// Use ai.defineTool
const generateMorningGreeting = ai.defineTool(
  {
    name: 'generateMorningGreeting',
    description: 'Generates a brief, cheerful morning greeting.',
    inputSchema: GreetingToolInputSchema,
    outputSchema: z.string(),
  },
  async (input: z.infer<typeof GreetingToolInputSchema>) => {
    const targetName = input?.name || 'there';
    const prompt = `Generate a brief, cheerful, single-sentence morning greeting for ${targetName}. Keep it under 15 words.`;
    console.debug(`Morning tool prompt: "${prompt}"`);
    // Use ai.generate inside the tool
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: { temperature: 0.7 },
      output: { format: 'text' },
    });
    // Revert to property access based on original code
    return llmResponse.text;
  },
);

// Tool 2: Afternoon Greeting
// Use ai.defineTool
const generateAfternoonGreeting = ai.defineTool(
  {
    name: 'generateAfternoonGreeting',
    description: 'Generates a short, friendly afternoon greeting.',
    inputSchema: GreetingToolInputSchema,
    outputSchema: z.string(),
  },
  async (input: z.infer<typeof GreetingToolInputSchema>) => {
    const targetName = input?.name || 'there';
    const prompt = `Generate a short, friendly, single-sentence afternoon greeting for ${targetName}. Keep it under 15 words.`;
    console.debug(`Afternoon tool prompt: "${prompt}"`);
    // Use ai.generate inside the tool
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: { temperature: 0.7 },
      output: { format: 'text' },
    });
    // Revert to property access based on original code
    return llmResponse.text;
  },
);

// Tool 3: Evening Greeting
// Use ai.defineTool
const generateEveningGreeting = ai.defineTool(
  {
    name: 'generateEveningGreeting',
    description: 'Generates a concise, calm evening greeting.',
    inputSchema: GreetingToolInputSchema,
    outputSchema: z.string(),
  },
  async (input: z.infer<typeof GreetingToolInputSchema>) => {
    const targetName = input?.name || 'there';
    const prompt = `Generate a concise, calm, single-sentence evening greeting for ${targetName}. Keep it under 15 words.`;
    console.debug(`Evening tool prompt: "${prompt}"`);
    // Use ai.generate inside the tool
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      config: { temperature: 0.7 },
      output: { format: 'text' },
    });
    // Revert to property access based on original code
    return llmResponse.text;
  },
);

// Define the main flow
// Use ai.defineFlow
export const selectGreetingFlow = ai.defineFlow(
  {
    name: 'selectGreetingFlow', // Unique name for the flow
    inputSchema: GreetingRequestSchema,
    outputSchema: GreetingResponseSchema,
    // Optional: Add description for clarity in UI/tracing
    // description: 'Selects and generates a greeting based on the time of day using tools.',
  },
  async (input: z.infer<typeof GreetingRequestSchema>) => {
    // Use the provided name or a default fallback
    const targetName = input.name || 'there';

    // MODIFIED Prompt: Explicitly instruct the LLM to use a tool
    const prompt = `You MUST use the correct greeting generation tool based on the time of day (${input.timeOfDay}) to generate a greeting for ${targetName}. Do NOT generate the greeting directly. Invoke the appropriate tool selected from the available tools.`;

    console.debug(`Flow prompt (forcing tool use): "${prompt}"`); // Log the prompt for debugging

    // Call the AI model, providing the tools it can use
    const llmResponse = await ai.generate({
      model: gemini15Flash, // Specify the model to use
      prompt,
      tools: [
        generateMorningGreeting,
        generateAfternoonGreeting,
        generateEveningGreeting,
      ],
      config: {
        temperature: 0.1, // Lower temperature might encourage more deterministic tool choice
      },
      output: { format: 'text' },
    });

    // Log the entire response for debugging
    console.log(
      'Inspecting llmResponse:',
      JSON.stringify(llmResponse, null, 2),
    );

    // Extract text from the message content
    const messageContent = llmResponse.message?.content?.[0];
    const textResult = messageContent?.text;

    if (textResult) {
      console.debug(`Extracted Text Response: "${textResult}"`);
      // Optional: Could add logic here to further parse the greeting
      // if the model wraps it in conversational text like "OK... The greeting is: ..."
      return textResult;
    } else {
      // If text is missing from the expected location
      console.error(
        'LLM response did not contain text in message.content[0].text',
        JSON.stringify(llmResponse, null, 2),
      );
      throw new Error(
        'Failed to generate greeting: LLM response format unexpected.',
      );
    }
  },
);
