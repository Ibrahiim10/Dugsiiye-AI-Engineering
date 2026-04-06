import mongoose, { Schema, models, model } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    age: Number,
    favorite_genre: String,
  },
  { timestamps: true },
);

export const User = models.User || model('User', UserSchema);
