import { startFlowServer } from '@genkit-ai/express';
import {
  menuSuggestionFlow,
  streamCharacters,
  structuredMenuSuggestionFlow,
} from './genkit';
import { calculatorFlow } from './flows/calculator.flow';
import { characterInfoFlow } from './flows/swapi.flow';
import { selectGreetingFlow } from './flows/greeting.flow';

startFlowServer({
  flows: [
    menuSuggestionFlow,
    structuredMenuSuggestionFlow,
    streamCharacters,
    calculatorFlow,
    characterInfoFlow,
    selectGreetingFlow,
  ],
});
