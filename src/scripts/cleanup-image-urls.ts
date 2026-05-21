import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/core-media-local';

async function runCleanup() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }

  // 1. Cleanup Blogs
  console.log('\n--- Cleaning up Blogs ---');
  const blogsCollection = db.collection('blogs');
  const blogsWithIds = await blogsCollection
    .find({
      $or: [
        {
          featureImage: { $regex: '^http' },
          featureImageId: { $exists: true, $ne: null },
        },
        {
          'seo.ogImage': { $regex: '^http' },
          'seo.ogImageId': { $exists: true, $ne: null },
        },
      ],
    })
    .toArray();

  console.log(`Found ${blogsWithIds.length} blogs to clean up.`);

  for (const blog of blogsWithIds) {
    const update: any = {};
    if (blog.featureImage?.startsWith('http') && blog.featureImageId) {
      update.featureImage = '';
    }
    if (blog.seo?.ogImage?.startsWith('http') && blog.seo?.ogImageId) {
      update['seo.ogImage'] = '';
    }

    if (Object.keys(update).length > 0) {
      await blogsCollection.updateOne({ _id: blog._id }, { $set: update });
      console.log(`Updated blog: ${blog.slug}`);
    }
  }

  // 2. Cleanup Websites
  console.log('\n--- Cleaning up Websites ---');
  const websitesCollection = db.collection('websites');
  const websitesWithIds = await websitesCollection
    .find({
      $or: [
        { logo: { $regex: '^http' }, logoId: { $exists: true, $ne: null } },
        {
          'seo.ogImage': { $regex: '^http' },
          'seo.ogImageId': { $exists: true, $ne: null },
        },
      ],
    })
    .toArray();

  console.log(`Found ${websitesWithIds.length} websites to clean up.`);

  for (const website of websitesWithIds) {
    const update: any = {};
    if (website.logo?.startsWith('http') && website.logoId) {
      update.logo = '';
    }
    if (website.seo?.ogImage?.startsWith('http') && website.seo?.ogImageId) {
      update['seo.ogImage'] = '';
    }

    if (Object.keys(update).length > 0) {
      await websitesCollection.updateOne(
        { _id: website._id },
        { $set: update },
      );
      console.log(`Updated website: ${website.slug}`);
    }
  }

  // 3. Cleanup System Users
  console.log('\n--- Cleaning up System Users ---');
  const usersCollection = db.collection('system_users');
  const usersWithIds = await usersCollection
    .find({
      profileImage: { $regex: '^http' },
      profileImageId: { $exists: true, $ne: null },
    })
    .toArray();

  console.log(`Found ${usersWithIds.length} users to clean up.`);

  for (const user of usersWithIds) {
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { profileImage: '' } },
    );
    console.log(`Updated user: ${user.email}`);
  }

  console.log('\nCleanup complete.');
  await mongoose.disconnect();
}

runCleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
