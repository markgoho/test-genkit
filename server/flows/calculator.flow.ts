// src/calculator.flow.ts
import * as z from 'zod';
import { ai } from '../genkit'; // Assuming your genkit setup is here
import { gemini15Flash } from '@genkit-ai/googleai';

// Define Schemas
const CalculationInputSchema = z.object({
  num1: z.number(),
  num2: z.number(),
});

const CalculationResponseSchema = z.number(); // Tools return numbers

const CalculatorFlowRequestSchema = z.object({
  request: z.string(), // e.g., "What is 5 times 3?"
});

const CalculatorFlowResponseSchema = z.string(); // Flow returns a string answer

// Tool 1: Add
const addTool = ai.defineTool(
  {
    name: 'addNumbers',
    description: 'Adds two numbers together.',
    inputSchema: CalculationInputSchema,
    outputSchema: CalculationResponseSchema,
  },
  async (input) => {
    console.log(`[addTool] Adding ${input.num1} and ${input.num2}`);
    return input.num1 + input.num2; // Directly return the number
  },
);

// Tool 2: Multiply
const multiplyTool = ai.defineTool(
  {
    name: 'multiplyNumbers',
    description: 'Multiplies two numbers together.',
    inputSchema: CalculationInputSchema,
    outputSchema: CalculationResponseSchema,
  },
  async (input) => {
    console.log(`[multiplyTool] Multiplying ${input.num1} and ${input.num2}`);
    return input.num1 * input.num2; // Directly return the number
  },
);

// Define the main Calculator Flow
export const calculatorFlow = ai.defineFlow(
  {
    name: 'calculatorFlow',
    inputSchema: CalculatorFlowRequestSchema,
    outputSchema: CalculatorFlowResponseSchema, // Flow must return a string
  },
  async (input) => {
    const prompt = `
        Based on the user request, determine if you need to add or multiply numbers.
        Extract the two numbers from the request: "${input.request}".
        Then, invoke the appropriate tool (addNumbers or multiplyNumbers) with the extracted numbers.
        Finally, formulate a user-friendly response sentence stating the operation and the result provided by the tool.
        Example Response: "The result of multiplying 5 by 3 is 15."
        Example Response: "Adding 10 and 25 gives you 35."
        Do NOT perform the calculation yourself, only use the tools provided.
      `;

    console.debug(`[calculatorFlow] Prompt: "${prompt}"`);

    // This generate call's job is to:
    // 1. Decide between addTool and multiplyTool.
    // 2. Extract num1 and num2.
    // 3. Let Genkit run the tool (which returns a number).
    // 4. Use the tool's numeric result to generate the final response string.
    const llmResponse = await ai.generate({
      model: gemini15Flash,
      prompt,
      tools: [addTool, multiplyTool],
      config: { temperature: 0.2 },
      // NO outputSchema here - we expect a complex response potentially involving tool calls/results
    });

    // console.log(
    //   '[calculatorFlow] Inspecting llmResponse:',
    //   JSON.stringify(llmResponse, null, 2),
    // );

    // Extract the final text formulated by the LLM after using the tool's result
    const messageContent = llmResponse.message?.content?.[0];
    const textResult = messageContent?.text;

    if (textResult) {
      console.debug(
        `[calculatorFlow] Extracted Text Response: "${textResult}"`,
      );
      return textResult; // This is the final string answer
    } else {
      console.error(
        '[calculatorFlow] LLM response did not contain text in message.content[0].text',
        JSON.stringify(llmResponse, null, 2),
      );
      throw new Error('Failed to calculate: LLM response format unexpected.');
    }
  },
);
