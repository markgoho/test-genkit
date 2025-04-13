import { z } from '@genkit-ai/core';

export const MenuItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  calories: z.number(),
  allergens: z.array(z.string()),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const GameCharactersSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
  }),
);

export type GameCharacters = z.infer<typeof GameCharactersSchema>;
