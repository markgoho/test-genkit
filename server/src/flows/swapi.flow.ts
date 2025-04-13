import * as z from 'zod';
import { ai } from '../genkit'; // Assuming your genkit setup is here
import { gemini15Flash } from '@genkit-ai/googleai';

// Input for the tool: Character ID
const FetchToolInputSchema = z.object({
  characterId: z.number().int().positive(),
});

// Output from the tool: Relevant character details
const FetchToolOutputSchema = z
  .object({
    name: z.string(),
    height: z.string(), // SWAPI returns height as string
    mass: z.string(), // SWAPI returns mass as string
    birth_year: z.string(),
  })
  .nullable(); // Allow null if character not found or error

type FetchToolOutput = z.infer<typeof FetchToolOutputSchema>;

// Input for the flow: Natural language request
const CharacterFlowRequestSchema = z.object({
  request: z.string(), // e.g., "Tell me about character ID 1"
});

// Output for the flow: Summarized string
const CharacterFlowResponseSchema = z.string();

// --- Tool Definition ---

const fetchCharacterTool = ai.defineTool(
  {
    name: 'fetchSwapiCharacter',
    description:
      'Fetches details (name, height, mass, birth year) for a character from the Star Wars API using their ID.',
    inputSchema: FetchToolInputSchema,
    outputSchema: FetchToolOutputSchema,
  },
  async (input) => {
    console.log(
      `[fetchCharacterTool] Fetching character ID: ${input.characterId}`
    );
    const url = `https://swapi.dev/api/people/${input.characterId}/`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(
            `[fetchCharacterTool] Character ID ${input.characterId} not found (404).`
          );
          return null; // Return null for not found
        }
        throw new Error(`SWAPI request failed with status ${response.status}`);
      }
      const data = (await response.json()) as FetchToolOutput;
      // Validate and select specific fields
      // Use safeParse to handle potential validation errors gracefully
      const parseResult = FetchToolOutputSchema.safeParse({
        name: data?.name,
        height: data?.height,
        mass: data?.mass,
        birth_year: data?.birth_year,
      });
      if (parseResult.success) {
        console.log(`[fetchCharacterTool] Fetched data:`, parseResult.data);
        return parseResult.data;
      } else {
        console.error(
          '[fetchCharacterTool] Failed to parse SWAPI response:',
          parseResult.error
        );
        return null; // Return null if parsing fails
      }
    } catch (error) {
      console.error(
        `[fetchCharacterTool] Error fetching character ID ${input.characterId}:`,
        error
      );
      // Decide how to handle errors - returning null is one option
      return null;
    }
  }
);

// --- Flow Definition ---

export const characterInfoFlow = ai.defineFlow(
  {
    name: 'characterInfoFlow',
    inputSchema: CharacterFlowRequestSchema,
    outputSchema: CharacterFlowResponseSchema,
  },
  async (input) => {
    const prompt = `
        Analyze the user's request: "${input.request}".
        1. Extract the numeric character ID mentioned in the request. If the request mentions a name (e.g., "Darth Vader") instead of an ID, ask the user to provide the ID.
        2. Invoke the 'fetchSwapiCharacter' tool with the extracted ID.
        3. Once you receive the character data (name, height, mass, birth year) from the tool:
           - If the tool returns data, formulate a sentence summarizing the information. Example: "Luke Skywalker is 172 cm tall, weighs 77 kg, and was born in 19BBY."
           - If the tool returns null (meaning the character wasn't found or an error occurred), respond with a message like "I couldn't find information for that character ID." or "There was an error fetching the character details."
        Do NOT make up information. Rely solely on the tool's output.
      `;

    console.debug(`[characterInfoFlow] Prompt: "${prompt}"`);

    // This generate call orchestrates: LLM extracts ID -> Genkit runs tool -> Tool returns data/null -> LLM formulates final sentence
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      tools: [fetchCharacterTool],
      config: { temperature: 0.1 },
      // No outputSchema here - the final response string is formulated by the LLM based on tool output
    });

    // console.log(
    //   '[characterInfoFlow] Inspecting llmResponse:',
    //   JSON.stringify(llmResponse, null, 2),
    // );

    // Extract the final text formulated by the LLM
    const messageContent = llmResponse.message?.content?.[0];
    const textResult = messageContent?.text;

    if (textResult) {
      console.debug(
        `[characterInfoFlow] Extracted Text Response: "${textResult}"`
      );
      return textResult;
    } else {
      console.error(
        '[characterInfoFlow] LLM response did not contain text in message.content[0].text',
        JSON.stringify(llmResponse, null, 2)
      );
      throw new Error(
        'Failed to get character info: LLM response format unexpected.'
      );
    }
  }
);
