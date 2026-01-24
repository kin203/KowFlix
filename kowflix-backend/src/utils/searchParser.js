// src/utils/searchParser.js

/**
 * Keyword dictionaries for mapping natural language terms to database values.
 * Keys are normalized (lowercase, unaccented could be handled but here we use simple lowercase).
 */

const GENRE_KEYWORDS = {
    "hành động": "Phim Hành Động",
    "hanh dong": "Phim Hành Động",
    "action": "Phim Hành Động",

    "tình cảm": "Phim Tình Cảm",
    "tinh cam": "Phim Tình Cảm",
    "lãng mạn": "Phim Lãng Mạn",
    "lang man": "Phim Lãng Mạn",
    "romance": "Phim Lãng Mạn",

    "hài": "Phim Hài",
    "hai": "Phim Hài",
    "hài hước": "Phim Hài",
    "comedy": "Phim Hài",

    "kinh dị": "Phim Kinh Dị",
    "kinh di": "Phim Kinh Dị",
    "ma": "Phim Kinh Dị",
    "horror": "Phim Kinh Dị",

    "viễn tưởng": "Phim Khoa Học Viễn Tưởng",
    "vien tuong": "Phim Khoa Học Viễn Tưởng",
    "sci-fi": "Phim Khoa Học Viễn Tưởng",

    "hoạt hình": "Phim Hoạt Hình",
    "hoat hinh": "Phim Hoạt Hình",
    "anime": "Phim Hoạt Hình",

    "tâm lý": "Phim Tâm Lý",
    "tam ly": "Phim Tâm Lý",
    "drama": "Phim Tâm Lý",

    "cổ trang": "Phim Cổ Trang",
    "co trang": "Phim Cổ Trang",
    "lịch sử": "Phim Cổ Trang",
    "history": "Phim Cổ Trang",

    "chiến tranh": "Phim Chiến Tranh",
    "chien tranh": "Phim Chiến Tranh",
    "war": "Phim Chiến Tranh",

    "gia đình": "Phim Gia Đình",
    "gia dinh": "Phim Gia Đình",
    "family": "Phim Gia Đình",

    "tội phạm": "Phim Hình Sự",
    "toi pham": "Phim Hình Sự",
    "crime": "Phim Hình Sự",

    "phiêu lưu": "Phim Phiêu Lưu",
    "phieu luu": "Phim Phiêu Lưu",
    "adventure": "Phim Phiêu Lưu",

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
