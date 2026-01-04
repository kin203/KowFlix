import Setting from '../models/Setting.js';

// Get all settings or a specific setting
export const getSettings = async (req, res) => {
    try {
        const { key } = req.query;

        if (key) {
            const setting = await Setting.findOne({ key });
            return res.json(setting || { key, value: null });
        }

        const settings = await Setting.find();
        // Convert to map for easier frontend consumption
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(settingsMap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update or create a setting
export const updateSetting = async (req, res) => {
    try {
        const { key, value, description } = req.body;

        if (!key) {
            return res.status(400).json({ message: "Key is required" });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            {
                value,
                description,
                updatedBy: req.user?._id // If auth middleware adds user
            },
            { new: true, upsert: true }
        );

        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle maintenance mode convenience endpoint
export const toggleMaintenance = async (req, res) => {
    try {
        const setting = await Setting.findOne({ key: 'maintenanceMode' });
        const newValue = !setting?.value;

        const updatedSetting = await Setting.findOneAndUpdate(
            { key: 'maintenanceMode' },
            {
                value: newValue,
                description: 'System maintenance mode'
            },
            { new: true, upsert: true }
        );

        res.json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
