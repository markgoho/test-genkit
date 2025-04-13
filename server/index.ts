import { startFlowServer } from '@genkit-ai/express';
import {
  menuSuggestionFlow,
  streamCharacters,
  structuredMenuSuggestionFlow,
} from './genkit';

startFlowServer({
  flows: [menuSuggestionFlow, structuredMenuSuggestionFlow, streamCharacters],
});
