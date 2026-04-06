import "dotenv/config";
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import User from "./models/User.js";
await mongoose.connect(process.env.MONGODB_URI);

await Movie.insertMany([
  {
    title: "Dune",
    year: 2021,
    genre: "Sci-Fi",
    rating: 8.6,
    director: "Denis Villeneuve",
    description: "Epic science fiction film",
  },
  {
    title: "Interstellar",
    year: 2014,
    genre: "Sci-Fi",
    rating: 8.7,
    director: "Christopher Nolan",
    description: "Space exploration and time dilation",
  },
]);

await User.insertMany([
  {
    name: "Alice",
    email: "alice@test.com",
    age: 30,
    favorite_genre: "Sci-Fi",
  },
  {
    name: "Bob",
    email: "bob@test.com",
    age: 22,
    favorite_genre: "Comedy",
  },
]);

console.log("Seeded DB ✅");
process.exit();
