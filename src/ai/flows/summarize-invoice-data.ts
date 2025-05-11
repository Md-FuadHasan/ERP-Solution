// Summarize invoice data into actionable reports using GenAI.

'use server';

/**
 * @fileOverview Summarizes invoice data to provide actionable reports.
 *
 * - summarizeInvoiceData - A function to summarize invoice data.
 * - SummarizeInvoiceDataInput - The input type for the summarizeInvoiceData function.
 * - SummarizeInvoiceDataOutput - The return type for the summarizeInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeInvoiceDataInputSchema = z.object({
  invoiceData: z
    .string()
    .describe('The invoice data to summarize, in JSON format.'),
});
export type SummarizeInvoiceDataInput = z.infer<typeof SummarizeInvoiceDataInputSchema>;

const SummarizeInvoiceDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the invoice data, including payment trends and customer balances.'),
});
export type SummarizeInvoiceDataOutput = z.infer<typeof SummarizeInvoiceDataOutputSchema>;

export async function summarizeInvoiceData(input: SummarizeInvoiceDataInput): Promise<SummarizeInvoiceDataOutput> {
  return summarizeInvoiceDataFlow(input);
}

const summarizeInvoiceDataPrompt = ai.definePrompt({
  name: 'summarizeInvoiceDataPrompt',
  input: {schema: SummarizeInvoiceDataInputSchema},
  output: {schema: SummarizeInvoiceDataOutputSchema},
  prompt: `You are an expert financial analyst.

You will receive invoice data in JSON format.  Your job is to summarize this data into an actionable report highlighting payment trends, customer balances, and any other relevant insights that would be helpful to a business owner.

Invoice Data:
{{invoiceData}}`,
});

const summarizeInvoiceDataFlow = ai.defineFlow(
  {
    name: 'summarizeInvoiceDataFlow',
    inputSchema: SummarizeInvoiceDataInputSchema,
    outputSchema: SummarizeInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await summarizeInvoiceDataPrompt(input);
    return output!;
  }
);
