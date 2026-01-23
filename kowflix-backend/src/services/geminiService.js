// src/services/geminiService.js
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = 'gemini-1.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

/**
 * Generate search keywords based on user watch history
 * @param {Array<string>} movieTitles - List of recently watched movie titles
 * @returns {Promise<Array<string>>} - List of keywords (genres, countries, moods)
 */
export const generateMovieKeywords = async (movieTitles) => {
    if (!API_KEY) {
        console.warn('GEMINI_API_KEY is missing. AI recommendations will be disabled.');
        return [];
    }

    if (!movieTitles || movieTitles.length === 0) {
        return [];
    }

    const titlesString = movieTitles.join(', ');
    const prompt = `
        I have watched the following movies: "${titlesString}".
        Analyze my taste and provide a list of exactly 3 to 5 Vietnamese keywords to search for similar movies.
        The keywords should be Genres (e.g., Hành động, Tình cảm, Kinh dị, Hoạt hình) or Countries (e.g., Hàn Quốc, Trung Quốc, Mỹ).
        Do not explain. Return ONLY the keywords separated by commas.
        Example output: Hành động, Mỹ, Khoa học viễn tưởng
    `;

    try {
        const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }]
        });

        if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const text = response.data.candidates[0].content.parts[0].text;
            // Clean up text: remove newlines, split by comma
            const keywords = text.split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0 && k.length < 30); // Basic validation

            console.log(`🤖 Gemini suggests: ${keywords.join(', ')}`);
            return keywords;
        }

        return [];
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        return []; // Fail gracefully
    }
};
