import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const fixDb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const collection = mongoose.connection.collection("users");

        console.log("Listing indexes...");
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes);

        const usernameIndex = indexes.find(idx => idx.name === "username_1" || (idx.key && idx.key.username));

        if (usernameIndex) {
            console.log("Found obsolete index 'username_1'. Dropping it...");
            await collection.dropIndex("username_1");
            console.log("✅ Index 'username_1' dropped successfully.");
        } else {
            console.log("ℹ️ Index 'username_1' not found. Nothing to do.");
        }

        console.log("Done.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

fixDb();
