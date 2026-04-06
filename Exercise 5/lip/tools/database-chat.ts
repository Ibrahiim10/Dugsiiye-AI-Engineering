import { tool } from 'ai';
import { z } from 'zod';
import { Movie } from '../model/Movie';
import { User } from '../model/User';
import { Review } from '../model/Review';
import { connectDB } from '../db';

function buildMongoQuery(
  collection: string,
  intent: string,
  value?: string | number,
) {
  if (collection === 'movies') {
    if (intent === 'genre' && typeof value === 'string') {
      return { genre: new RegExp(value, 'i') };
    }

    if (intent === 'ratingAbove' && typeof value === 'number') {
      return { rating: { $gt: value } };
    }
  }

  if (collection === 'users') {
    if (intent === 'ageAbove' && typeof value === 'number') {
      return { age: { $gt: value } };
    }
  }

  return null;
}

export const databaseChatTool = tool({
  description:
    'Query the MongoDB database for movies, users, reviews, and aggregations.',
  inputSchema: z.object({
    collection: z.enum(['movies', 'users', 'reviews']),
    action: z.enum(['find', 'count', 'aggregate']),
    intent: z.enum(['genre', 'ratingAbove', 'ageAbove', 'countByGenre']),
    value: z.union([z.string(), z.number()]).optional(),
    limit: z.number().min(1).max(50).default(10),
  }),
  execute: async ({ collection, action, intent, value, limit }) => {
    await connectDB();

    try {
      if (
        collection === 'movies' &&
        action === 'aggregate' &&
        intent === 'countByGenre'
      ) {
        const data = await Movie.aggregate([
          {
            $group: {
              _id: '$genre',
              total: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
        ]);

        return {
          ok: true,
          collection,
          action,
          count: data.length,
          data,
          metadata: {
            queryType: 'aggregation',
          },
        };
      }

      const mongoQuery = buildMongoQuery(collection, intent, value);

      if (!mongoQuery) {
        return {
          ok: false,
          error: 'Unsupported query pattern',
          metadata: { collection, action, intent },
        };
      }

      let data: any[] = [];

      if (collection === 'movies') {
        data =
          action === 'count'
            ? [{ total: await Movie.countDocuments(mongoQuery) }]
            : await Movie.find(mongoQuery).limit(limit).lean();
      }

      if (collection === 'users') {
        data =
          action === 'count'
            ? [{ total: await User.countDocuments(mongoQuery) }]
            : await User.find(mongoQuery).limit(limit).lean();
      }

      if (collection === 'reviews') {
        data =
          action === 'count'
            ? [{ total: await Review.countDocuments(mongoQuery) }]
            : await Review.find(mongoQuery).limit(limit).lean();
      }

      return {
        ok: true,
        collection,
        action,
        count: data.length,
        data,
        metadata: {
          query: mongoQuery,
          limit,
        },
      };
    } catch (error) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : 'Unknown database error',
        metadata: { collection, action, intent },
      };
    }
  },
});
