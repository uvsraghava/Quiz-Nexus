// models/User.ts
import mongoose, { Schema, models } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent mongoose from recompiling the model upon hot-reloads
const User = models.User || mongoose.model('User', userSchema);
export default User;