// Debug script to inspect cast data
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './src/models/Movie.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kowflix';

async function debugCast() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const movies = await Movie.find({}).limit(3);

        for (const movie of movies) {
            console.log(`\n📽️  ${movie.title}`);
            console.log(`   Cast type: ${typeof movie.cast}`);
            console.log(`   Is array: ${Array.isArray(movie.cast)}`);
            console.log(`   Length: ${movie.cast?.length}`);

            if (movie.cast && movie.cast.length > 0) {
                console.log(`   First element type: ${typeof movie.cast[0]}`);
                console.log(`   First element value:`, movie.cast[0]);

                if (typeof movie.cast[0] === 'object') {
                    console.log(`   Has 'name' field: ${movie.cast[0].name !== undefined}`);
                    console.log(`   Object keys:`, Object.keys(movie.cast[0]));
                }
            }

            console.log(`   Full cast:`, JSON.stringify(movie.cast, null, 2));
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n\n👋 Disconnected');
    }
}

debugCast();
