import mongoose, { Schema, models } from 'mongoose';

const submissionSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  // Relaxed requirement for delayed grading
  score: { type: Number, default: 0 }, 
  totalQuestions: { type: Number, required: true },
  answers: { type: Schema.Types.Mixed, default: {} }, 
  // NEW: Evaluation flow states
  status: { type: String, enum: ['graded', 'pending'], default: 'graded' },
  feedback: { type: String } 
}, { timestamps: true });

const Submission = models.Submission || mongoose.model('Submission', submissionSchema);
export default Submission;