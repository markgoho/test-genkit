import { z } from 'zod';
import { ai } from '../genkit';

// Schema for the dice roller tool output
const DiceRollResultSchema = z.object({
  rolls: z.array(z.number()).describe('List of individual dice roll results'),
  modifier: z.number().describe('The modifier added to the sum'),
  sum: z.number().describe('The total sum of rolls plus the modifier'),
});

// Schema for the dice roller tool input
export const DiceRollInputSchema = z.object({
  diceNotation: z
    .string()
    .describe('Dice notation (e.g., "2d6", "1d20+3", "3d8-1")')
    .refine(
      (val) => /^\\d+d\\d+([+-]\\d+)?$/.test(val), // Basic regex validation
      { message: 'Invalid dice notation format' },
    ),
});

export const diceRollerTool = ai.defineTool(
  {
    name: 'diceRollerTool',
    description: 'Rolls dice based on standard notation (e.g., "2d6", "1d20+3").',
    inputSchema: DiceRollInputSchema,
    outputSchema: DiceRollResultSchema,
  },
  async ({ diceNotation }) => {
    console.log('Executing diceRollerTool with:', diceNotation);
    const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
    if (!match) {
      // Should be caught by Zod refine, but belt-and-suspenders
      throw new Error('Invalid dice notation provided to tool implementation');
    }

    const numDice = parseInt(match[1]!, 10);
    const numSides = parseInt(match[2]!, 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * numSides) + 1;
      rolls.push(roll);
      sum += roll;
    }
    sum += modifier;

    const result = { rolls, modifier, sum };
    console.log('Dice roll result:', result);
    return result;
  },
);
