import mongoose, { Schema, models } from 'mongoose';

const submissionSchema = new Schema({
  testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  answers: { type: Schema.Types.Mixed, default: {} } // NEW: Tell Mongoose to save the answers!
}, { timestamps: true });

const Submission = models.Submission || mongoose.model('Submission', submissionSchema);
export default Submission;