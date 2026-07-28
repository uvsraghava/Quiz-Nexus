import mongoose, { Schema, models } from 'mongoose';

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true }
});

const testSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, // Added this line for the timer
  startTime: { type: Date }, // NEW: Added optional start time for scheduled tests
  questions: [questionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Test = models.Test || mongoose.model('Test', testSchema);
export default Test;