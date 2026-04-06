import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { openai } from '@ai-sdk/openai';
import { databaseChatTool } from '@/lip/tools/database-chat';
import { dadJokeTool } from '@/lip/tools/joke-tool';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-5'),
    system: `
      You are a movie assistant with database access.
      Use tools when the user asks to search movies, users, reviews, or jokes.
      Always prefer tools over guessing.
      Return concise answers and include structured summaries of tool results.
    `,
    messages: convertToModelMessages(messages),
    tools: {
      databaseChatTool,
      // movieSearchTool,
      dadJokeTool,
    },
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
