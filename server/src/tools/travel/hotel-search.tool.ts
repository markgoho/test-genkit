import { z } from 'zod';
import { ai } from '../../genkit'; // Adjust path as needed

export const HotelSearchInputSchema = z.object({
  location: z.string().describe('City or area to search for hotels'),
  checkInDate: z.string().describe('Check-in date (YYYY-MM-DD)'),
  checkOutDate: z.string().describe('Check-out date (YYYY-MM-DD)'),
  numberOfGuests: z.number().int().positive().describe('Number of guests'),
  preferences: z.array(z.string()).optional().describe('Optional preferences (e.g., budget, free wifi, pool)'),
});

export const HotelOptionSchema = z.object({
  name: z.string(),
  rating: z.number().min(1).max(5).optional(),
  pricePerNight: z.number().optional(),
  amenities: z.array(z.string()).optional(),
});

export const HotelSearchOutputSchema = z.array(HotelOptionSchema);

// Infer types from schemas
type HotelSearchInput = z.infer<typeof HotelSearchInputSchema>;
type HotelSearchOutput = z.infer<typeof HotelSearchOutputSchema>;

export const hotelSearchTool = ai.defineTool(
  {
    name: 'hotelSearchTool',
    description: 'Searches for available hotels based on location, dates, guests, and preferences.',
    inputSchema: HotelSearchInputSchema,
    outputSchema: HotelSearchOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: HotelSearchInput): Promise<HotelSearchOutput> => {
    console.log(`[Tool] Searching hotels for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 900));
    // Simulate finding some hotels
    // Use the inferred type for the array
    const hotels: HotelSearchOutput = [
      { name: 'Grand Hyatt', rating: 5, pricePerNight: 300, amenities: ['pool', 'gym', 'free wifi'] },
      { name: 'Comfort Inn', rating: 3, pricePerNight: 120, amenities: ['free wifi', 'breakfast'] },
    ];
    if (input.preferences?.includes('budget')) {
      hotels.push({ name: 'Motel 6', rating: 2, pricePerNight: 80, amenities: [] });
    }
    if (input.location.toLowerCase().includes('beach')) {
      hotels.push({ name: 'Seaside Resort', rating: 4, pricePerNight: 250, amenities: ['pool', 'beach access'] });
    }
    return hotels;
  },
);
