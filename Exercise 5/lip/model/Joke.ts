import mongoose, { Schema, models, model } from 'mongoose';

const JokeSchema = new Schema(
  {
    content: { type: String, required: true, index: true },
    category: { type: String, default: 'general', index: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    source: { type: String, default: 'api' },
  },
  { timestamps: true },
);

export const Joke = models.Joke || model('Joke', JokeSchema);
