import mongoose, { Schema, models } from 'mongoose';

const submissionSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 }, 
  totalQuestions: { type: Number, required: true },
  // answers is Mixed, natively supporting our new string array arrays
  answers: { type: Schema.Types.Mixed, default: {} }, 
  status: { type: String, enum: ['graded', 'pending'], default: 'graded' },
  feedback: { type: String } 
}, { timestamps: true });

const Submission = models.Submission || mongoose.model('Submission', submissionSchema);
export default Submission;