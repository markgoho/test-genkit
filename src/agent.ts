import {
  GenerateResponse,
  Genkit,
  MessageData,
  ModelArgument,
  PartSchema,
  ToolArgument,
} from 'genkit';
import { GenerateResponseSchema } from 'genkit/model';
import { z } from '@genkit-ai/core';

export interface HistoryStore {
  load(id: string): Promise<MessageData[] | undefined>;
  save(id: string, history: MessageData[]): Promise<void>;
}

export const AgentInput = z.object({
  conversationId: z.string(),
  prompt: z.union([z.string(), PartSchema, z.array(PartSchema)]),
  config: z.record(z.string(), z.any()).optional(),
});

type AgentFn = (
  request: z.infer<typeof AgentInput>,
  history: MessageData[] | undefined,
) => Promise<GenerateResponse<any>>;

export function defineAgent(
  ai: Genkit,
  {
    name,
    tools,
    model,
    historyStore,
    systemPrompt,
    returnToolRequests,
  }: {
    name: string;
    systemPrompt?: string;
    tools?: ToolArgument[];
    model: ModelArgument<any>;
    historyStore?: HistoryStore;
    returnToolRequests?: boolean;
  },
  customFn?: AgentFn,
) {
  return ai.defineFlow(
    { name, inputSchema: AgentInput, outputSchema: GenerateResponseSchema },
    async (request, streamingCallback) => {
      const history = await ai.run(
        'retrieve-history',
        request.conversationId,
        async () => {
          let history = request.conversationId
            ? await historyStore?.load(request.conversationId)
            : undefined;
          if (!history && systemPrompt) {
            history = [
              {
                role: 'system',
                content: [
                  {
                    text: systemPrompt,
                  },
                ],
              },
            ];
          }
          return history;
        },
      );
      const resp = customFn
        ? await customFn(request, history)
        : await ai.generate({
            prompt: request.prompt,
            messages: history,
            model,
            tools,
            returnToolRequests,
            streamingCallback,
          });
      await ai.run(
        'save-history',
        { conversationId: request.conversationId, history: resp.messages },
        async () => {
          request.conversationId
            ? await historyStore?.save(request.conversationId, resp.messages)
            : undefined;
        },
      );
      return resp.toJSON();
    },
  );
}
