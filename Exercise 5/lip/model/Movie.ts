import mongoose, { Schema, models, model } from 'mongoose';

const MovieSchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    year: Number,
    genre: { type: String, index: true },
    rating: Number,
    director: String,
    description: String,
    poster: String,
    cast: [String],
    runtime: String,
    source: { type: String, default: 'local' },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Movie = models.Movie || model('Movie', MovieSchema);
