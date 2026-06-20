/**
 * One-time: generate slugs for all existing members that don't have one.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Member from '../models/Member.js';

dotenv.config();

function toSlug(str) {
  return str.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sjcu_platform', serverSelectionTimeoutMS: 10000 });

const members = await Member.find({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] });
console.log(`Found ${members.length} members without slugs`);

const usedSlugs = new Set((await Member.find({ slug: { $exists: true, $ne: '' } })).map(m => m.slug));

for (const member of members) {
  let base = toSlug(member.name);
  let slug = base;
  let i = 1;
  while (usedSlugs.has(slug)) { slug = `${base}-${i++}`; }
  usedSlugs.add(slug);
  await Member.updateOne({ _id: member._id }, { $set: { slug } });
  console.log(`✅ ${member.name} → /team/${slug}`);
}

console.log('Migration complete!');
await mongoose.disconnect();
process.exit(0);
