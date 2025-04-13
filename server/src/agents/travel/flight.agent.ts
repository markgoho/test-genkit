import { ai } from '../../genkit';
import { flightBookingTool } from '../../tools/travel/flight-booking.tool';
import { flightSearchTool } from '../../tools/travel/flight-search.tool';

export const flightAgent = ai.definePrompt({
  name: 'flightAgent',
  description: 'Flight specialist agent. Helps find and book flights.',
  tools: [flightSearchTool, flightBookingTool],
  system: `You are a flight specialist agent. Your goal is to help users find and book flights.
                 Use the flightSearchTool to find flight options based on the user's provided criteria (origin, destination, dates, passengers).
                 Present the findings clearly. If the user chooses a flight, use the flightBookingTool.
                 Always confirm the exact flight number, date, and passenger name before attempting to book.
                 If booking fails or a flight is unavailable, inform the user clearly.
                `,
});
