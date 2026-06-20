import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, minlength: 6 },
  role:         { type: String, enum: ['admin', 'super_admin'], default: 'admin' },
  status:       { type: String, enum: ['pending', 'active'], default: 'active' },
  inviteToken:  { type: String },
  inviteExpiry: { type: Date },
  dob:          { type: Date },
  gender:       { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  avatar:       { type: String, default: '' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.inviteToken;
  return obj;
};

export default mongoose.model('User', userSchema);
