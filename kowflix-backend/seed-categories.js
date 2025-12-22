import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from './src/models/Category.js';

dotenv.config();

const defaultCategories = [
    {
        name: 'Phim Hành Động',
        slug: 'phim-hanh-dong',
        description: 'Những bộ phim đầy kịch tính với các pha hành động mãn nhãn',
        color: '#E67E22',
        icon: '💥',
        link: '/category/phim-hanh-dong',
        order: 1,
        isActive: true
    },
    {
        name: 'Phim Hài Hước',
        slug: 'phim-hai-huoc',
        description: 'Những bộ phim mang lại tiếng cười và niềm vui',
        color: '#F1C40F',
        icon: '😄',
        link: '/category/phim-hai-huoc',
        order: 2,
        isActive: true
    },
    {
        name: 'Phim Tình Cảm',
        slug: 'phim-tinh-cam',
        description: 'Những câu chuyện tình yêu lãng mạn và cảm động',
        color: '#E91E63',
        icon: '💕',
        link: '/category/phim-tinh-cam',
        order: 3,
        isActive: true
    },
    {
        name: 'Phim Kinh Dị',
        slug: 'phim-kinh-di',
        description: 'Những bộ phim rùng rợn, đầy kịch tính',
        color: '#34495E',
        icon: '👻',
        link: '/category/phim-kinh-di',
        order: 4,
        isActive: true
    },
    {
        name: 'Phim Khoa Học Viễn Tưởng',
        slug: 'phim-khoa-hoc-vien-tuong',
        description: 'Khám phá thế giới tương lai và công nghệ',
        color: '#3498DB',
        icon: '🚀',
        link: '/category/phim-khoa-hoc-vien-tuong',
        order: 5,
        isActive: true
    },
    {
        name: 'Phim Hoạt Hình',
        slug: 'phim-hoat-hinh',
        description: 'Phim hoạt hình cho mọi lứa tuổi',
        color: '#9B59B6',
        icon: '🎨',
        link: '/category/phim-hoat-hinh',
        order: 6,
        isActive: true
    },
    {
        name: 'Marvel',
        slug: 'marvel',
        description: 'Vũ trụ điện ảnh Marvel với các siêu anh hùng',
        color: '#5865F2',
        icon: '🦸',
        link: '/category/marvel',
        order: 7,
        isActive: true
    },
    {
        name: '4K Ultra HD',
        slug: '4k-ultra-hd',
        description: 'Phim chất lượng 4K Ultra HD',
        color: '#57F287',
        icon: '📺',
        link: '/category/4k-ultra-hd',
        order: 8,
        isActive: true
    },
    {
        name: 'Lồng Tiếng Việt',
        slug: 'long-tieng-viet',
        description: 'Phim được lồng tiếng tiếng Việt',
        color: '#9B59B6',
        icon: '🇻🇳',
        link: '/category/long-tieng-viet',
        order: 9,
        isActive: true
    },
    {
        name: 'Xuyên Không',
        slug: 'xuyen-khong',
        description: 'Những câu chuyện xuyên không gian và thời gian',
        color: '#F39C12',
        icon: '⏰',
        link: '/category/xuyen-khong',
        order: 10,
        isActive: true
    },
    {
        name: 'Cổ Trang',
        slug: 'co-trang',
        description: 'Phim cổ trang Trung Quốc, Hàn Quốc',
        color: '#E74C3C',
        icon: '👘',
        link: '/category/co-trang',
        order: 11,
        isActive: true
    },
    {
        name: 'Phim Hàn Quốc',
        slug: 'phim-han-quoc',
        description: 'Phim điện ảnh và truyền hình Hàn Quốc',
        color: '#1ABC9C',
        icon: '🇰🇷',
        link: '/category/phim-han-quoc',
        order: 12,
        isActive: true
    },
    {
        name: 'Anime',
        slug: 'anime',
        description: 'Phim hoạt hình Nhật Bản',
        color: '#E91E63',
        icon: '🎌',
        link: '/category/anime',
        order: 13,
        isActive: true
    },
    {
        name: 'Trending',
        slug: 'trending',
        description: 'Phim đang thịnh hành',
        color: '#FF6B6B',
        icon: '🔥',
        link: '/category/trending',
        order: 14,
        isActive: true
    }
];

const seedCategories = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🗑️  Clearing existing categories...');
        await Category.deleteMany({});
        console.log('✅ Cleared existing categories');

        console.log('📝 Creating default categories...');
        const createdCategories = await Category.insertMany(defaultCategories);
        console.log(`✅ Created ${createdCategories.length} categories:`);

        createdCategories.forEach(cat => {
            console.log(`   ${cat.icon} ${cat.name} (${cat.slug})`);
        });

        console.log('\n🎉 Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

seedCategories();
