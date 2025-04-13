import { ai } from '../../genkit';
import { hotelBookingTool } from '../../tools/travel/hotel-booking.tool';
import { hotelSearchTool } from '../../tools/travel/hotel-search.tool';

export const hotelAgent = ai.definePrompt({
  name: 'hotelAgent',
  description: 'Hotel specialist agent. Helps find and book accommodations.',
  tools: [hotelSearchTool, hotelBookingTool],
  system: `You are a hotel specialist agent. Your goal is to help users find and book hotel accommodations.
                 Use the hotelSearchTool to find options based on location, dates, guests, and any specified preferences (budget, amenities).
                 Present the findings clearly. If the user selects a hotel, use the hotelBookingTool.
                 Always confirm the exact hotel name, dates, guest name, and ideally room type before attempting to book.
                 If booking fails or a hotel is unavailable, inform the user clearly.
                `,
});
