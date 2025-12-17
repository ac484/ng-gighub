/**
 * @fileOverview Extracts structured data from a document to create an Engagement.
 * @description This Genkit flow receives a file, analyzes it, and extracts key
 * information like name, value, client, and a Work Breakdown Structure (WBS).
 */
'use server';

import { z } from 'genkit';

import { TaskSchema } from '../types/engagement.types';

import { ai } from '@/ai/genkit';

const ExtractEngagementDataInputSchema = z.object({
  fileDataUri: z.string().describe("A document (contract, quote, etc.) as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'.")
});

const ExtractEngagementDataOutputSchema = z.object({
  name: z.string().describe('The name or title of the engagement.'),
  client: z.string().describe('The client or customer name.'),
  totalValue: z.number().describe('The total value before tax (subtotal).'),
  tax: z.number().optional().describe('The total tax amount, if specified.'),
  totalValueWithTax: z.number().optional().describe('The grand total value including tax.'),
  tasks: z.array(TaskSchema).describe('The Work Breakdown Structure (WBS).')
});

export type ExtractEngagementDataOutput = z.infer<typeof ExtractEngagementDataOutputSchema>;

const prompt = ai.definePrompt({
  name: 'extractEngagementDataPrompt',
  input: { schema: ExtractEngagementDataInputSchema },
  output: { schema: ExtractEngagementDataOutputSchema },
  prompt: `You are an expert financial analyst for construction projects.
Analyze the provided document and extract the following information:
1.  **Engagement Name**: The official title of the project or contract.
2.  **Client Name**: The customer or entity for whom the work is being done.
3.  **Total Value (Subtotal)**: The total value before tax.
4.  **Tax**: The total tax amount. If not specified, this can be omitted.
5.  **Total Value with Tax**: The grand total including tax. If not specified, this can be omitted.
6.  **Work Breakdown Structure (Tasks)**: A detailed list of all work items. For each item, provide a unique id, title, quantity, unitPrice, value, discount (if any), lastUpdated (as an ISO string), completedQuantity (default to 0), and an empty subTasks array.

Document for analysis: {{media url=fileDataUri}}`
});

const extractEngagementDataFlow = ai.defineFlow(
  {
    name: 'extractEngagementDataFlow',
    inputSchema: ExtractEngagementDataInputSchema,
    outputSchema: ExtractEngagementDataOutputSchema
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI flow failed to return structured data.');
    }
    return output;
  }
);

export async function extractEngagementData(input: z.infer<typeof ExtractEngagementDataInputSchema>): Promise<ExtractEngagementDataOutput> {
  return await extractEngagementDataFlow(input);
}
