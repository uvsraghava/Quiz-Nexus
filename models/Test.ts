import mongoose, { Schema, models } from 'mongoose';

const questionSchema = new Schema({
  questionText: { type: String, required: true },
  // Relaxed requirement to allow for descriptive questions
  options: [{ type: String }], 
  correctAnswer: { type: String } 
});

const testSchema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, 
  startTime: { type: Date }, 
  // NEW: Descriptive test fields
  testType: { type: String, enum: ['mcq', 'descriptive'], default: 'mcq' },
  caseStudyText: { type: String }, 
  maxMarks: { type: Number }, 
  questions: [questionSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const Test = models.Test || mongoose.model('Test', testSchema);
export default Test;