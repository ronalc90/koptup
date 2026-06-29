import mongoose from 'mongoose';
import User from '../models/User';
import { connectDB } from '../config/mongodb';

/**
 * Script to set a user as admin by email
 * Usage: npx tsx src/scripts/set-admin.ts <email>
 */
const setAdmin = async () => {
  try {
    const email = process.argv[2] || process.env.ADMIN_EMAIL || 'ronald@koptup.com';

    console.log(`🔧 Setting admin role for: ${email}`);

    // Connect to MongoDB
    await connectDB();

    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('💡 Make sure the user has logged in at least once.');
      process.exit(1);
    }

    console.log(`✅ Successfully set ${email} as admin`);
    console.log(`📝 User details:`);
    console.log(`   - ID: ${user._id}`);
    console.log(`   - Name: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Provider: ${user.provider}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin:', error);
    process.exit(1);
  }
};

// Execute if called directly
if (require.main === module) {
  setAdmin();
}

export default setAdmin;
