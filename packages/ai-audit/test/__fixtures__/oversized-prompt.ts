import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: 'sk-test' });

export async function analyzeDocument() {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert document analyzer. Your task is to carefully read through the provided document and extract all relevant information including but not limited to: key entities mentioned (people, organizations, locations, dates, monetary amounts), the overall sentiment and tone of the document, any action items or recommendations mentioned, relationships between entities, temporal sequences of events described, legal or regulatory implications, technical specifications or requirements listed, statistical data or metrics referenced, potential risks or concerns highlighted, and any conclusions or summaries provided by the author. Please structure your response in a clear hierarchical format with main categories and subcategories. For each extracted piece of information provide the confidence level of your extraction as high medium or low. Also note any ambiguities or areas where the document is unclear. If the document references other documents or external sources please note those references as well. Your analysis should be thorough yet concise avoiding unnecessary repetition while ensuring no important details are missed. Pay special attention to any dates deadlines or time-sensitive information as these may require immediate attention. If numerical data is present verify that any calculations or totals mentioned in the document are consistent with the individual figures provided. Note any discrepancies you find. Finally provide a brief executive summary of no more than three paragraphs that captures the essence of the document for a busy executive who may not have time to read the full analysis. This summary should highlight the most critical findings and any recommended next steps. Remember to maintain objectivity throughout your analysis and clearly distinguish between facts stated in the document and your own interpretations or inferences. If you encounter specialized terminology provide brief explanations to ensure the analysis is accessible to a general business audience.',
      },
      { role: 'user', content: 'Please analyze this quarterly report.' },
    ],
  });
  return response;
}
