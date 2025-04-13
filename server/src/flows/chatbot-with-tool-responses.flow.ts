import { z } from 'zod';
import { ai } from '../genkit';
import type { MessageData, ToolResponsePart, Part } from '@genkit-ai/ai/model';
import { diceRollerTool, DiceRollInputSchema } from '../tools/fun';

// Re-add the Zod schemas for client communication
const TextChunkSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});
const ToolRequestChunkSchema = z.object({
  type: z.literal('tool_request'),
  toolName: z.string(),
  toolInput: z.any(),
});
const ToolResponseChunkSchema = z.object({
  type: z.literal('tool_response'),
  toolName: z.string(),
  toolOutput: z.any(),
});
const ChatStreamSchema = z.union([TextChunkSchema, ToolRequestChunkSchema, ToolResponseChunkSchema]);

// Infer the type for the chunks we send to the client
type ClientStreamChunk = z.infer<typeof ChatStreamSchema>;

export const chatbotWithToolResponsesFlow = ai.defineFlow(
  {
    name: 'chatbotWithToolResponses',
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.void(),
    streamSchema: ChatStreamSchema, // Use the defined client schema
  },
  async ({ message }, { sendChunk }) => {
    const chat = ai.chat({
      system: 'You are a playful assistant. Use the dice roller tool when asked.',
      tools: [diceRollerTool],
      returnToolRequests: true,
    });

    // console.log('[FLOW] Starting manual chat loop...');
    let currentResponse = await chat.send(message);

    while (true) {
      const toolRequests = currentResponse.toolRequests;
      const textContent = currentResponse.text;

      // console.log('[FLOW] Loop iteration. Text:', textContent, 'Tool Requests:', toolRequests?.length);

      if (toolRequests && toolRequests.length > 0) {
        const toolRequestData = toolRequests[0];
        if (!toolRequestData?.toolRequest) {
          // console.warn('[FLOW] Tool request structure unexpected:', toolRequestData);
          break;
        }
        const toolRequest = toolRequestData.toolRequest;

        // console.log('[FLOW] Handling Tool Request:', toolRequest.name);

        // Send tool_request chunk matching schema
        const reqChunk: ClientStreamChunk = {
          type: 'tool_request',
          toolName: toolRequest.name,
          toolInput: toolRequest.input,
        };
        sendChunk(reqChunk);

        let toolOutput;
        if (toolRequest.name === 'diceRollerTool') {
          try {
            // console.log('[FLOW] Executing diceRollerTool with input:', toolRequest.input);
            toolOutput = await diceRollerTool(toolRequest.input as z.infer<typeof DiceRollInputSchema>);
            // console.log('[FLOW] Tool execution successful, output:', toolOutput);
          } catch (e) {
            console.error('[FLOW] Tool execution error:', e); // Keep this essential error log
            toolOutput = { error: e instanceof Error ? e.message : 'Unknown tool error' };
          }
        } else {
          // console.warn('[FLOW] Unknown tool requested:', toolRequest.name);
          toolOutput = { error: `Tool ${toolRequest.name} not found.` };
        }

        // Send tool_response chunk matching schema
        const respChunk: ClientStreamChunk = {
          type: 'tool_response',
          toolName: toolRequest.name,
          toolOutput: toolOutput,
        };
        sendChunk(respChunk);

        const toolResponseMsg: MessageData = {
          role: 'tool',
          content: [{ toolResponse: { name: toolRequest.ref || toolRequest.name, output: toolOutput } }],
        };
        // console.log('[FLOW] Sending tool response back to model...');
        currentResponse = await chat.send(toolResponseMsg.content);
      } else if (textContent) {
        // Send text chunk matching schema
        const textChunk: ClientStreamChunk = { type: 'text', text: textContent };
        sendChunk(textChunk);
        break;
      } else {
        // console.warn('[FLOW] Received response with neither text nor tool request. Ending loop.');
        break;
      }
    }

    // console.log('[FLOW] Manual chat loop finished.');
    // Send a final, empty text chunk (Keep try...catch here)
    try {
      const finalChunk: ClientStreamChunk = { type: 'text', text: '' };
      sendChunk(finalChunk);
    } catch (e) {
      console.error('[FLOW] Error sending final empty text chunk:', e);
    }

    return;
  },
);
