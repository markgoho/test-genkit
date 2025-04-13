import { z } from 'zod';
import { ai } from '../../genkit'; // Adjust path as needed

export const HotelBookingInputSchema = z.object({
  hotelName: z.string().describe('Name of the hotel to book'),
  checkInDate: z.string().describe('Check-in date (YYYY-MM-DD)'),
  checkOutDate: z.string().describe('Check-out date (YYYY-MM-DD)'),
  numberOfGuests: z.number().int().positive().describe('Number of guests'),
  guestName: z.string().describe('Name of the primary guest'),
  roomType: z.string().optional().describe('Optional room type preference (e.g., King, Queen, Suite)'),
});

export const HotelBookingOutputSchema = z.object({
  confirmationNumber: z.string().describe('Booking confirmation number'),
  status: z.enum(['booked', 'failed', 'unavailable']).describe('Booking status'),
});

// Infer types from schemas
type HotelBookingInput = z.infer<typeof HotelBookingInputSchema>;
type HotelBookingOutput = z.infer<typeof HotelBookingOutputSchema>;

export const hotelBookingTool = ai.defineTool(
  {
    name: 'hotelBookingTool',
    description: 'Books a hotel room based on the provided details.',
    inputSchema: HotelBookingInputSchema,
    outputSchema: HotelBookingOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: HotelBookingInput): Promise<HotelBookingOutput> => {
    console.log(`[Tool] Booking hotel for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 600));
    const outcome = Math.random();
    if (outcome > 0.25) {
      return {
        confirmationNumber: `HT-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        status: 'booked', // Type matches HotelBookingOutput
      };
    } else if (outcome > 0.1) {
      return {
        confirmationNumber: '',
        status: 'unavailable', // Type matches HotelBookingOutput
      };
    } else {
      return {
        confirmationNumber: '',
        status: 'failed', // Type matches HotelBookingOutput
      };
    }
  },
);
