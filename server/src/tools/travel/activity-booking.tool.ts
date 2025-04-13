import { z } from 'zod';
import { ai } from '../../genkit';

export const ActivityBookingInputSchema = z.object({
  activityName: z.string().describe('Name of the activity/tour to book'),
  date: z.string().describe('Date for the activity (YYYY-MM-DD)'),
  numberOfTickets: z.number().int().positive().describe('Number of tickets required'),
  attendeeName: z.string().describe('Name of the primary attendee'),
});

export const ActivityBookingOutputSchema = z.object({
  confirmationNumber: z.string().describe('Booking confirmation number'),
  status: z.enum(['booked', 'failed', 'unavailable']).describe('Booking status'),
});

// Infer types from schemas
type ActivityBookingInput = z.infer<typeof ActivityBookingInputSchema>;
type ActivityBookingOutput = z.infer<typeof ActivityBookingOutputSchema>;

export const activityBookingTool = ai.defineTool(
  {
    name: 'activityBookingTool',
    description: 'Books tickets for a specific activity or tour.',
    inputSchema: ActivityBookingInputSchema,
    outputSchema: ActivityBookingOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: ActivityBookingInput): Promise<ActivityBookingOutput> => {
    console.log(`[Tool] Booking activity for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 550));
    const outcome = Math.random();
    if (outcome > 0.3) {
      return {
        confirmationNumber: `AT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        status: 'booked', // Type matches ActivityBookingOutput
      };
    } else if (outcome > 0.1) {
      return {
        confirmationNumber: '',
        status: 'unavailable', // Type matches ActivityBookingOutput
      };
    } else {
      return {
        confirmationNumber: '',
        status: 'failed', // Type matches ActivityBookingOutput
      };
    }
  },
);
