import { ai } from '../../genkit';
import { activityBookingTool } from '../../tools/travel/activity-booking.tool';
import { activitySearchTool } from '../../tools/travel/activity-search.tool';

export const activityAgent = ai.definePrompt({
  name: 'activityAgent',
  description: 'Activity specialist agent. Helps find and book local activities and tours.',
  tools: [activitySearchTool, activityBookingTool],
  system: `You are a local tour and activity specialist. Your goal is to help users discover and book things to do based on their destination and interests.
                 Use the available tools to search for activities or points of interest.
                 Confirm details like dates, number of people, and specific activity name before attempting to book.
                 If a search returns multiple options, present them clearly to the user for selection before proceeding to book.
                 If booking fails or an activity is unavailable, clearly state that to the user.
                `,
});
