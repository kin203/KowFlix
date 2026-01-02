// Migration script: Add wishlist field to all existing users
// Run this once: node src/scripts/addWishlistToUsers.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const addWishlistToAllUsers = async () => {
    try {
        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Update all users that don't have wishlist field
        const result = await User.updateMany(
            { wishlist: { $exists: false } },
            { $set: { wishlist: [] } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users with wishlist field`);

        // Also ensure all users have wishlist (even if it exists but is null)
        const result2 = await User.updateMany(
            { wishlist: null },
            { $set: { wishlist: [] } }
        );

        console.log(`✅ Fixed ${result2.modifiedCount} users with null wishlist`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

addWishlistToAllUsers();
