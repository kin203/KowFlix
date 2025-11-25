// Migration script to add trailers to existing movies
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie from './src/models/Movie.js';
import { getMovieTrailer } from './src/utils/tmdb.js';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kowflix';

async function migrateTrailers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find all movies with tmdbId but no trailerKey
        const movies = await Movie.find({
            tmdbId: { $exists: true, $ne: null },
            $or: [
                { trailerKey: { $exists: false } },
                { trailerKey: '' }
            ]
        });

        console.log(`Found ${movies.length} movies to update`);

        let successCount = 0;
        let failCount = 0;

        for (const movie of movies) {
            try {
                console.log(`\nProcessing: ${movie.title} (TMDb ID: ${movie.tmdbId})`);

                const trailerKey = await getMovieTrailer(movie.tmdbId);

                if (trailerKey) {
                    movie.trailerKey = trailerKey;
                    await movie.save();
                    console.log(`✓ Trailer added: ${trailerKey}`);
                    successCount++;
                } else {
                    console.log(`✗ No trailer found`);
                    failCount++;
                }

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 250));
            } catch (error) {
                console.error(`Error processing ${movie.title}:`, error.message);
                failCount++;
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Total movies processed: ${movies.length}`);
        console.log(`Trailers added: ${successCount}`);
        console.log(`No trailer found: ${failCount}`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit();
    }
}

migrateTrailers();
