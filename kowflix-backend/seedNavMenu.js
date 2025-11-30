// Seed script for default navbar menu items
// Run this once to populate default menu items

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NavMenuItem from './src/models/NavMenuItem.js';

dotenv.config();

const defaultMenuItems = [
    {
        label: 'Home',
        path: '/',
        icon: 'fa-home',
        order: 1,
        isActive: true,
        parentId: null,
        requiresAuth: false,
        requiresAdmin: false,
        isExternal: false,
        description: 'Trang chủ'
    },
    {
        label: 'Movies',
        path: '/movies',
        icon: 'fa-film',
        order: 2,
        isActive: true,
        parentId: null,
        requiresAuth: false,
        requiresAdmin: false,
        isExternal: false,
        description: 'Danh sách phim'
    },
    {
        label: 'Series',
        path: '/series',
        icon: 'fa-tv',
        order: 3,
        isActive: true,
        parentId: null,
        requiresAuth: false,
        requiresAdmin: false,
        isExternal: false,
        description: 'Danh sách phim bộ'
    },
    {
        label: 'New & Popular',
        path: '/new',
        icon: 'fa-fire',
        order: 4,
        isActive: true,
        parentId: null,
        requiresAuth: false,
        requiresAdmin: false,
        isExternal: false,
        description: 'Phim mới và phổ biến'
    },
    {
        label: 'My List',
        path: '/list',
        icon: 'fa-bookmark',
        order: 5,
        isActive: true,
        parentId: null,
        requiresAuth: true,
        requiresAdmin: false,
        isExternal: false,
        description: 'Danh sách yêu thích của tôi'
    }
];

const seedMenuItems = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing menu items
        await NavMenuItem.deleteMany({});
        console.log('Cleared existing menu items');

        // Insert default menu items
        await NavMenuItem.insertMany(defaultMenuItems);
        console.log('Default menu items created successfully!');

        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding menu items:', error);
        process.exit(1);
    }
};

seedMenuItems();
