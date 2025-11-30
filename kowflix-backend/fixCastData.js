// Migration script to fix CORRUPTED cast data
// Run with: node fixCastData.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './src/models/Movie.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kowflix';

async function fixCastData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const movies = await Movie.find({}).lean(); // Use .lean() to get plain objects
        console.log(`📊 Found ${movies.length} movies to check`);

        let fixed = 0;
        let skipped = 0;
        let errors = 0;

        for (const movie of movies) {
            try {
                let needsUpdate = false;
                let newCast = movie.cast;

                // Check if cast exists
                if (!movie.cast || movie.cast.length === 0) {
                    skipped++;
                    continue;
                }

                // Check if cast is already in correct format
                const isCorrectFormat = Array.isArray(movie.cast) &&
                    movie.cast.length > 0 &&
                    typeof movie.cast[0] === 'object' &&
                    movie.cast[0].name !== undefined &&
                    movie.cast[0].profile_path !== undefined;

                if (isCorrectFormat) {
                    console.log(`✓ ${movie.title} - Already correct format`);
                    skipped++;
                    continue;
                }

                // Fix: Handle CORRUPTED object (string split into char keys)
                // e.g., { '0': 'T', '1': 'r', '2': 'ấ', ... }
                if (Array.isArray(movie.cast) &&
                    movie.cast.length > 0 &&
                    typeof movie.cast[0] === 'object' &&
                    movie.cast[0]['0'] !== undefined) {

                    console.log(`🔧 ${movie.title} - Fixing CORRUPTED cast data (char-keyed object)`);

                    // Reconstruct string from char keys
                    const charKeys = Object.keys(movie.cast[0])
                        .filter(k => !isNaN(k)) // Only numeric keys
                        .sort((a, b) => parseInt(a) - parseInt(b));

                    const reconstructedString = charKeys
                        .map(k => movie.cast[0][k])
                        .join('');

                    console.log(`   Reconstructed: "${reconstructedString}"`);

                    // Split by comma and create object array
                    newCast = reconstructedString
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map(name => ({ name, profile_path: null }));

                    needsUpdate = true;
                }
                // Fix: Handle array with single comma-separated string
                else if (Array.isArray(movie.cast) &&
                    movie.cast.length === 1 &&
                    typeof movie.cast[0] === 'string' &&
                    movie.cast[0].includes(',')) {

                    console.log(`🔧 ${movie.title} - Splitting comma-separated string`);
                    newCast = movie.cast[0]
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean)
                        .map(name => ({ name, profile_path: null }));
                    needsUpdate = true;
                }
                // Fix: Convert string array to object array
                else if (Array.isArray(movie.cast) && typeof movie.cast[0] === 'string') {
                    console.log(`🔧 ${movie.title} - Converting string array to object array`);
                    newCast = movie.cast.map(actorName => ({
                        name: actorName,
                        profile_path: null
                    }));
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    await Movie.updateOne(
                        { _id: movie._id },
                        { $set: { cast: newCast } }
                    );
                    console.log(`✅ ${movie.title} - Fixed! (${newCast.length} actors)`);
                    fixed++;
                } else {
                    skipped++;
                }

            } catch (err) {
                console.error(`❌ Error fixing ${movie.title}:`, err.message);
                errors++;
            }
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Fixed: ${fixed}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📝 Total: ${movies.length}`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

// Run migration
fixCastData();
