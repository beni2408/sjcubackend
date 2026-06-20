/**
 * One-time script: promote a user to super_admin by email
 * Usage: node scripts/makeSuperAdmin.js your@email.com
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const email = process.argv[2];
if (!email) { console.error('Usage: node scripts/makeSuperAdmin.js <email>'); process.exit(1); }

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sjcu_platform' });

const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { role: 'super_admin' },
    { new: true }
);

if (!user) {
    console.error(`❌ No user found with email: ${email}`);
} else {
    console.log(`✅ ${user.name} (${user.email}) is now super_admin`);
}

await mongoose.disconnect();
process.exit(0);
