import { z } from 'zod';
import { ai } from '../genkit';
import type { MessageData, ToolRequestPart } from '@genkit-ai/ai/model';
// Explicitly import agents
import { triageAgent } from '../agents/travel/triage.agent';
import { flightAgent } from '../agents/travel/flight.agent';
import { hotelAgent } from '../agents/travel/hotel.agent';
import { activityAgent } from '../agents/travel/activity.agent';
import {
  flightSearchTool,
  flightBookingTool,
  hotelSearchTool,
  hotelBookingTool,
  activitySearchTool,
  activityBookingTool,
} from '../tools/travel'; // Import all underlying tools

// Define the schema for data chunks streamed to the client
// We need types for text, agent delegation, tool requests, and tool responses.
const TextChunkSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const AgentDelegationChunkSchema = z.object({
  type: z.literal('agent_delegation'),
  agentName: z.string(),
  // Maybe include the input passed to the agent?
});

const ToolRequestChunkSchema = z.object({
  type: z.literal('tool_request'),
  agentName: z.string(), // Which agent requested the tool?
  toolName: z.string(),
  toolInput: z.any(),
});

const ToolResponseChunkSchema = z.object({
  type: z.literal('tool_response'),
  agentName: z.string(), // Which agent is receiving the response?
  toolName: z.string(),
  toolOutput: z.any(),
});

// Define the schema for data chunks streamed to the client - SIMPLIFIED
const FinalResponseSchema = z.object({
  text: z.string(),
});

// Map tool names to their actual tool objects for easy lookup - NO LONGER NEEDED
/*
const availableTools: Record<string, any> = {
  [flightSearchTool.name]: flightSearchTool,
  [flightBookingTool.name]: flightBookingTool,
  [hotelSearchTool.name]: hotelSearchTool,
  [hotelBookingTool.name]: hotelBookingTool,
  [activitySearchTool.name]: activitySearchTool,
  [activityBookingTool.name]: activityBookingTool,
};
*/

// Map agent names for easier checking - NO LONGER NEEDED
/*
const agentNames = {
  triage: triageAgent.name,
  flight: flightAgent.name,
  hotel: hotelAgent.name,
  activity: activityAgent.name,
};
*/

// No longer needed
/*
const MultiAgentChatStreamSchema = z.union([
    TextChunkSchema,
    AgentDelegationChunkSchema,
    ToolRequestChunkSchema,
    ToolResponseChunkSchema,
]);
type MultiAgentChatStreamChunk = z.infer<typeof MultiAgentChatStreamSchema>;
*/

export const multiAgentTravelFlow = ai.defineFlow(
  {
    name: 'multiAgentTravelFlow',
    inputSchema: z.object({ message: z.string() }),
    // Output is void, but stream is just the final text
    outputSchema: z.void(),
    streamSchema: FinalResponseSchema, // Use the simplified schema
  },
  // SIMPLIFIED FLOW LOGIC
  async ({ message }, { sendChunk }) => {
    console.log('[FLOW: Travel Simplified] Starting flow with message:', message);

    // Initialize chat with only the triage agent
    // No 'tools' array, no 'returnToolRequests: true'
    const chat = ai.chat(triageAgent);

    try {
      // Send the message and wait for the FINAL response after internal tool calls
      const finalResponse = await chat.send(message);

      console.log('[FLOW: Travel Simplified] Received final response:', finalResponse.text);

      // Send the final text response as a single chunk
      if (finalResponse.text) {
        sendChunk({ text: finalResponse.text });
      }

      // Send an empty chunk to signal completion (optional)
      sendChunk({ text: '' });
    } catch (error) {
      console.error('[FLOW: Travel Simplified] Error during chat execution:', error);
      // Send an error message chunk (adjust schema if needed for errors)
      sendChunk({ text: `Sorry, an error occurred: ${error instanceof Error ? error.message : String(error)}` });
      sendChunk({ text: '' });
    }

    console.log('[FLOW: Travel Simplified] Flow finished.');
    return; // Flow completes
  },
  // REMOVED the previous complex while loop and associated logic
);
