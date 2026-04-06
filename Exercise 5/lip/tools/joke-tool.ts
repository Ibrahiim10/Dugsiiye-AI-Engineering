import { tool } from 'ai';
import { z } from 'zod';
import axios from 'axios';
import { connectDB } from '../db';
import { Joke } from '../model/Joke';

const localFallbackJokes = [
  {
    content:
      'Why do programmers prefer dark mode? Because light attracts bugs.',
    category: 'programming',
  },
  {
    content: 'I only know 25 letters of the alphabet. I do not know y.',
    category: 'dad',
  },
  {
    content: 'What do you call fake spaghetti? An impasta.',
    category: 'general',
  },
];

export const dadJokeTool = tool({
  description:
    'Fetch random jokes, search jokes, and rate jokes with fallback to local database.',
  inputSchema: z.object({
    action: z.enum(['random', 'search', 'rate']),
    keyword: z.string().optional(),
    jokeId: z.string().optional(),
    vote: z.enum(['up', 'down']).optional(),
    category: z.enum(['dad', 'programming', 'general']).optional(),
  }),
  execute: async ({ action, keyword, jokeId, vote, category }) => {
    await connectDB();

    try {
      if (action === 'search') {
        const jokes = await Joke.find({
          content: new RegExp(keyword || '', 'i'),
          ...(category ? { category } : {}),
        })
          .limit(10)
          .lean();

        return { ok: true, data: jokes };
      }

      if (action === 'rate') {
        if (!jokeId || !vote) {
          return {
            ok: false,
            error: 'jokeId and vote are required for rating',
          };
        }

        const update =
          vote === 'up' ? { $inc: { likes: 1 } } : { $inc: { dislikes: 1 } };
        const updated = await Joke.findByIdAndUpdate(jokeId, update, {
          new: true,
        }).lean();

        return { ok: true, data: updated };
      }

      const response = await axios.get('https://icanhazdadjoke.com/', {
        headers: { Accept: 'application/json' },
        timeout: 5000,
      });

      const saved = await Joke.create({
        content: response.data.joke,
        category: category || 'dad',
        source: 'api',
      });

      return { ok: true, source: 'api', data: saved };
    } catch {
      const existing = await Joke.find(category ? { category } : {})
        .limit(10)
        .lean();

      if (existing.length > 0) {
        return { ok: true, source: 'db-fallback', data: existing[0] };
      }

      return {
        ok: true,
        source: 'local-fallback',
        data:
          localFallbackJokes.find(
            (j) => !category || j.category === category,
          ) || localFallbackJokes[0],
      };
    }
  },
});
