import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const setAdmin = async () => {
    try {
        const email = process.argv[2];
        if (!email) {
            console.error("Please provide an email address. Usage: node src/scripts/set_admin.js <email>");
            process.exit(1);
        }

        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User with email '${email}' not found.`);
            process.exit(1);
        }

        user.role = "admin";
        await user.save();

        console.log(`✅ User '${email}' has been promoted to ADMIN.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

setAdmin();
