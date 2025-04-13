import { z } from 'zod';
import { ai } from '../../genkit'; // Adjust path as needed

export const FlightSearchInputSchema = z.object({
  origin: z.string().describe('Departure city or airport code'),
  destination: z.string().describe('Arrival city or airport code'),
  departureDate: z.string().describe('Departure date (YYYY-MM-DD)'),
  returnDate: z.string().optional().describe('Optional return date (YYYY-MM-DD)'),
  passengers: z.number().int().positive().describe('Number of passengers'),
});

export const FlightOptionSchema = z.object({
  flightNumber: z.string(),
  departureTime: z.string(),
  arrivalTime: z.string(),
  price: z.number(),
  airline: z.string(),
});

export const FlightSearchOutputSchema = z.array(FlightOptionSchema);

// Infer types from schemas
type FlightSearchInput = z.infer<typeof FlightSearchInputSchema>;
type FlightSearchOutput = z.infer<typeof FlightSearchOutputSchema>;

export const flightSearchTool = ai.defineTool(
  {
    name: 'flightSearchTool',
    description: 'Searches for available flights based on origin, destination, dates, and passengers.',
    inputSchema: FlightSearchInputSchema,
    outputSchema: FlightSearchOutputSchema,
  },
  // Explicitly type input and return Promise
  async (input: FlightSearchInput): Promise<FlightSearchOutput> => {
    console.log(`[Tool] Searching flights for: ${JSON.stringify(input)}`);
    // Placeholder: Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // Simulate finding some flights
    // Explicitly type the array to match the output schema
    const flights: FlightSearchOutput = [
      { flightNumber: 'UA123', departureTime: '08:00', arrivalTime: '10:30', price: 350, airline: 'United' },
      { flightNumber: 'DL456', departureTime: '09:15', arrivalTime: '11:45', price: 320, airline: 'Delta' },
    ];
    if (input.destination.toLowerCase() === 'london') {
      flights.push({
        flightNumber: 'BA789',
        departureTime: '10:00',
        arrivalTime: '22:00',
        price: 600,
        airline: 'British Airways',
      });
    }
    return flights;
  },
);
