import { z } from 'zod';
import { ai } from '../../genkit';

export const ActivitySearchInputSchema = z.object({
  location: z.string().describe('City or region for the activity search'),
  interests: z.array(z.string()).optional().describe('Optional list of interests (e.g., hiking, museum, food)'),
  date: z.string().optional().describe('Optional specific date (YYYY-MM-DD)'),
});

export const ActivitySearchOutputSchema = z.array(
  z.object({
    name: z.string(),
    description: z.string(),
    priceEstimate: z.string().optional(),
  }),
);

// Infer types from schemas
type ActivitySearchInput = z.infer<typeof ActivitySearchInputSchema>;
type ActivitySearchOutput = z.infer<typeof ActivitySearchOutputSchema>;

export const activitySearchTool = ai.defineTool(
  {
    name: 'activitySearchTool',
    description:
      'Searches for local activities, tours, and points of interest based on location and optional interests.',
    inputSchema: ActivitySearchInputSchema,
    outputSchema: ActivitySearchOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: ActivitySearchInput): Promise<ActivitySearchOutput> => {
    console.log(`[Tool] Searching activities for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 700));
    // Simulate finding some activities
    // Explicitly type the array to match the output schema
    const activities: ActivitySearchOutput = [
      { name: 'City Walking Tour', description: 'Explore the historic downtown.', priceEstimate: '$30' },
      { name: 'Museum of Modern Art', description: 'Contemporary art exhibits.', priceEstimate: '$25' },
    ];
    if (input.interests?.includes('food')) {
      activities.push({ name: 'Local Food Tasting', description: 'Sample regional delicacies.', priceEstimate: '$75' });
    }
    if (input.location.toLowerCase() === 'paris') {
      activities.push({ name: 'Eiffel Tower Visit', description: 'Iconic landmark.', priceEstimate: '$50' });
    }
    return activities;
  },
);
