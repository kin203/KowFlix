// src/utils/searchParser.js

/**
 * Keyword dictionaries for mapping natural language terms to database values.
 * Keys are normalized (lowercase, unaccented could be handled but here we use simple lowercase).
 */

const GENRE_KEYWORDS = {
    "hành động": "Hành động",
    "hanh dong": "Hành động",
    "action": "Hành động",

    "tình cảm": "Lãng mạn",
    "tinh cam": "Lãng mạn",
    "lãng mạn": "Lãng mạn",
    "lang man": "Lãng mạn",
    "romance": "Lãng mạn",

    "hài": "Hài",
    "hai": "Hài",
    "hài hước": "Hài",
    "comedy": "Hài",

    "kinh dị": "Kinh dị",
    "kinh di": "Kinh dị",
    "ma": "Kinh dị",
    "horror": "Kinh dị",

    "viễn tưởng": "Khoa học Viễn tưởng",
    "vien tuong": "Khoa học Viễn tưởng",
    "sci-fi": "Khoa học Viễn tưởng",

    "hoạt hình": "Hoạt hình",
    "hoat hinh": "Hoạt hình",
    "anime": "Hoạt hình",

    "tâm lý": "Chính kịch", // Often mapped to Drama
    "tam ly": "Chính kịch",
    "drama": "Chính kịch",

    "cổ trang": "Cổ trang", // Assuming you have this custom genre or it maps to History
    "co trang": "Cổ trang",
    "lịch sử": "Lịch sử",
    "history": "Lịch sử",

    "chiến tranh": "Chiến tranh",
    "chien tranh": "Chiến tranh",
    "war": "Chiến tranh",

    "gia đình": "Gia đình",
    "gia dinh": "Gia đình",
    "family": "Gia đình",

    "tội phạm": "Hình sự",
    "toi pham": "Hình sự",
    "crime": "Hình sự",

    "phiêu lưu": "Phiêu lưu",
    "phieu luu": "Phiêu lưu",
    "adventure": "Phiêu lưu",

    "bí ẩn": "Bí ẩn",
    "bi an": "Bí ẩn",
    "mystery": "Bí ẩn"
};

const COUNTRY_KEYWORDS = {
    "hàn quốc": "Hàn Quốc",
    "han quoc": "Hàn Quốc",
    "hàn": "Hàn Quốc",
    "korea": "Hàn Quốc",
    "kdrama": "Hàn Quốc",

    "trung quốc": "Trung Quốc",
    "trung quoc": "Trung Quốc",
    "trung": "Trung Quốc",
    "china": "Trung Quốc",
    "cdrama": "Trung Quốc",

    "âu mỹ": "Hoa Kỳ", // Broad mapping, but usually US
    "au my": "Hoa Kỳ",
    "mỹ": "Hoa Kỳ",
    "my": "Hoa Kỳ",
    "us": "Hoa Kỳ",
    "usa": "Hoa Kỳ",

    "việt nam": "Việt Nam",
    "viet nam": "Việt Nam",
    "việt": "Việt Nam",
    "viet": "Việt Nam",

    "nhật bản": "Nhật Bản",
    "nhat ban": "Nhật Bản",
    "nhật": "Nhật Bản",
    "japan": "Nhật Bản",
    "anime": "Nhật Bản", // Context dependent, but safe guess if combined

    "thái lan": "Thái Lan",
    "thai lan": "Thái Lan",
    "thái": "Thái Lan",
    "thai": "Thái Lan"
};

/**
 * Removes extra whitespace and lowercases string
 */
function normalize(str) {
    return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Parses a natural language search query.
 * @param {string} query The raw search query (e.g., "phim hàn quốc tình cảm")
 * @returns {Object} { text: string, genres: string[], countries: string[] }
 */
export function parseSearchQuery(query) {
    if (!query) return { text: "", genres: [], countries: [] };

    let normalizedQuery = normalize(query);
    const result = {
        genres: [],
        countries: [],
        text: normalizedQuery
    };

    // Helper to extract keywords
    const extractKeywords = (dictionary, targetArray) => {
        // Sort keys by length descending to match longest phrases first (e.g. "hàn quốc" before "hàn")
        const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

        for (const key of keys) {
            // Check if key exists as a whole word or phrase
            // Use whitespace boundaries instead of \b which doesn't support Vietnamese characters well
            const regex = new RegExp(`(?:^|\\s)${key}(?=$|\\s)`, 'i');
            if (regex.test(normalizedQuery)) {
                // Add matched value if not already present
                const value = dictionary[key];
                if (!targetArray.includes(value)) {
                    targetArray.push(value);
                }

                // Remove the keyword from the query string
                // Replace with space to avoid merging adjacent words
                normalizedQuery = normalizedQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
            }
        }
    };

    extractKeywords(COUNTRY_KEYWORDS, result.countries);
    extractKeywords(GENRE_KEYWORDS, result.genres);

    // Clean up remaining text keywords like "phim", "về", "của", "tuyển", "tập", "movie", "film"
    const stopWords = ["phim", "về", "của", "tuyển", "tập", "movie", "film"];
    for (const word of stopWords) {
        // Same regex fix for stop words
        const regex = new RegExp(`(?:^|\\s)${word}(?=$|\\s)`, 'i');
        normalizedQuery = normalizedQuery.replace(regex, ' ').replace(/\s+/g, ' ').trim();
    }

    result.text = normalizedQuery;

    return result;
}
