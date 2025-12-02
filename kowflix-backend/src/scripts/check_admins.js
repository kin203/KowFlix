import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const email = 'admin@kowflix.com'; // Assuming this is the admin email, or I'll list all admins

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const admins = await User.find({ role: 'admin' });
        console.log('Found admins:', admins.length);
        admins.forEach(admin => {
            console.log(`- ${admin.email} (Role: ${admin.role}, ID: ${admin._id})`);
        });

        if (admins.length === 0) {
            console.log('WARNING: No admin users found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

run();
