// review.model.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
  },
  comment: {
    type: String,
    trim: true,
    maxLength: [500, "Comment cannot exceed 500 characters"],
  },
}, {
  timestamps: true,
});

// Prevent duplicate reviews from the same user on a single course
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
