import mongoose, { Schema, models, model } from 'mongoose';

const ReviewSchema = new Schema(
  {
    movie_id: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Review = models.Review || model('Review', ReviewSchema);
