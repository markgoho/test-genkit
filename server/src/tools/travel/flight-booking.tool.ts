import { z } from 'zod';
import { ai } from '../../genkit';

export const FlightBookingInputSchema = z.object({
  flightNumber: z.string().describe('The specific flight number to book'),
  date: z.string().describe('Date of the flight (YYYY-MM-DD)'),
  passengerName: z.string().describe('Full name of the passenger'),
  seatPreference: z.string().optional().describe('Optional seat preference (e.g., window, aisle)'),
});

export const FlightBookingOutputSchema = z.object({
  confirmationNumber: z.string().describe('Booking confirmation number'),
  status: z.enum(['booked', 'failed', 'unavailable']).describe('Booking status'),
});

// Infer types from schemas
type FlightBookingInput = z.infer<typeof FlightBookingInputSchema>;
type FlightBookingOutput = z.infer<typeof FlightBookingOutputSchema>;

export const flightBookingTool = ai.defineTool(
  {
    name: 'flightBookingTool',
    description: 'Books a specific flight based on the provided details.',
    inputSchema: FlightBookingInputSchema,
    outputSchema: FlightBookingOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: FlightBookingInput): Promise<FlightBookingOutput> => {
    console.log(`[Tool] Booking flight for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    const outcome = Math.random();
    if (outcome > 0.2) {
      return {
        confirmationNumber: `FL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        status: 'booked', // Type matches FlightBookingOutput
      };
    } else if (outcome > 0.05) {
      return {
        confirmationNumber: '',
        status: 'unavailable', // Type matches FlightBookingOutput
      };
    } else {
      return {
        confirmationNumber: '',
        status: 'failed', // Type matches FlightBookingOutput
      };
    }
  },
);
