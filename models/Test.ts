import mongoose, { Schema, models } from 'mongoose';

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  options: [{ type: String }], 
  // UPGRADED: Changed to Mixed to support both legacy single strings and new arrays
  correctAnswer: { type: Schema.Types.Mixed } 
});

const testSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, 
  startTime: { type: Date }, 
  testType: { type: String, enum: ['mcq', 'descriptive'], default: 'mcq' },
  caseStudyText: { type: String }, 
  maxMarks: { type: Number }, 
  questions: [questionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Test = models.Test || mongoose.model('Test', testSchema);
export default Test;