import { z } from 'zod';
import { ai } from '../genkit';
import { currentTimeTool, echoTool } from '../tools/utility'; // Import the tools

export const chatbotWithToolsFlow = ai.defineFlow(
  {
    name: 'chatbotWithTools',
    inputSchema: z.object({
      message: z.string(),
    }),
    // Output is streamed, so no explicit outputSchema needed here
    // Stream schema defaults to string chunks, which is suitable
  },
  async ({ message }, { sendChunk }) => {
    // Configure the chat model with the tools
    const chat = ai.chat({
      system: 'You are a helpful assistant. Use the available tools when appropriate.',
      tools: [currentTimeTool, echoTool], // Make tools available
    });

    // Use sendStream to handle the chat interaction, including potential tool calls
    const { stream } = chat.sendStream(message);

    // Iterate over the stream and send text chunks back to the client
    for await (const chunk of stream) {
      // chunk is GenerateResponseChunk, access text content
      const textContent = chunk.content[0]?.text;
      if (textContent) {
        // Send the raw string chunk
        sendChunk(textContent);
      }
      // Note: Genkit's ai.chat().sendStream() automatically handles the
      // tool request/response cycle internally. The chunks yielded here
      // should primarily be the textual parts of the LLM's responses,
      // including summaries or results derived from tool use.
    }

    // Return void as the primary output is streamed
    return;
  },
);
