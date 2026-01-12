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

        if (key === 'maintenanceMode') {
            if (value === true) {
                const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
                await Setting.findOneAndUpdate(
                    { key: 'maintenanceScheduledStart' },
                    { value: fiveMinutesFromNow.toISOString(), description: 'Scheduled start time for maintenance' },
                    { upsert: true }
                );
            } else {
                await Setting.findOneAndUpdate(
                    { key: 'maintenanceScheduledStart' },
                    { value: null, description: 'Scheduled start time for maintenance' },
                    { upsert: true }
                );
            }
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
        let updateData = {
            value: newValue,
            description: 'System maintenance mode'
        };

        // If enabling maintenance, set scheduled start time to 5 minutes from now
        if (newValue) {
            const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
            await Setting.findOneAndUpdate(
                { key: 'maintenanceScheduledStart' },
                { value: fiveMinutesFromNow.toISOString(), description: 'Scheduled start time for maintenance' },
                { upsert: true }
            );
        } else {
            // If disabling, clear the start time
            await Setting.findOneAndUpdate(
                { key: 'maintenanceScheduledStart' },
                { value: null, description: 'Scheduled start time for maintenance' },
                { upsert: true }
            );
        }

        const updatedSetting = await Setting.findOneAndUpdate(
            { key: 'maintenanceMode' },
            updateData,
            { new: true, upsert: true }
        );

        res.json(updatedSetting);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
