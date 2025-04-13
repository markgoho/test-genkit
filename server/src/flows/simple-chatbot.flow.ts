import { z } from 'zod';
import { ai } from '../genkit';

export const simpleChatbotFlow = ai.defineFlow(
  {
    name: 'simpleChatbot',
    inputSchema: z.object({
      message: z.string(),
    }),
    // Remove streamSchema to rely on default handling
    // streamSchema: z.object({ textChunk: z.string() }),
    // Output schema can be omitted if we only return void
  },
  async ({ message }, { sendChunk }) => {
    const chat = ai.chat({
      system: 'talk like a pirate',
    });

    // Use sendStream() to get the response promise and the stream
    const { response, stream } = chat.sendStream(message);

    // Iterate over the stream and send chunks using the flow's sendChunk
    for await (const chunk of stream) {
      // chunk is GenerateResponseChunk, access text content
      const textContent = chunk.content[0]?.text;
      if (textContent) {
        // Send the raw string chunk
        sendChunk(textContent);
      }
    }

    // Optional: Wait for the final response if needed for logging or final value
    // const finalResponse = await response;
    // console.log('Final response:', finalResponse.text);

    // Return void as the primary output is streamed
    return;
  },
);
