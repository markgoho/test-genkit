import { startFlowServer } from '@genkit-ai/express';
import { selectGreetingFlow } from './greeting.flow';
import { calculatorFlow } from './calculator.flow';
import { characterInfoFlow } from './swapi.flow';
import { chartGenerationFlow } from './chart.flow';

startFlowServer({
  flows: [
    selectGreetingFlow,
    calculatorFlow,
    characterInfoFlow,
    chartGenerationFlow,
  ],
});
