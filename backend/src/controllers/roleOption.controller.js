const RoleOption = require('../models/RoleOption');

// GET /admin/settings/role-options
// Public-facing: only active options, sorted, for LoginScreen
exports.getPublicRoleOptions = async (req, res) => {
    try {
        const options = await RoleOption.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 })
            .select('role label desc icon -_id');

        return res.status(200).json(options);
    } catch (err) {
        return res.status(500).json({ message: 'Could not fetch role options', error: err.message });
    }
};

// GET /admin/settings/role-options/all
// Admin panel: all options including inactive ones, with _id for edit/delete
exports.getAllRoleOptions = async (req, res) => {
    try {
        const options = await RoleOption.find().sort({ order: 1, createdAt: 1 });
        return res.status(200).json(options);
    } catch (err) {
        return res.status(500).json({ message: 'Could not fetch role options', error: err.message });
    }
};

// POST /admin/settings/role-options
exports.createRoleOption = async (req, res) => {
    try {
        const { role, label, desc, icon, order, isActive } = req.body;

        if (!role || !label || !desc) {
            return res.status(400).json({ message: 'role, label and desc are required' });
        }

        const exists = await RoleOption.findOne({ role: role.toLowerCase().trim() });
        if (exists) {
            return res.status(409).json({ message: `Role option "${role}" already exists` });
        }

        const option = await RoleOption.create({
            role: role.toLowerCase().trim(),
            label,
            desc,
            icon: icon || 'briefcase-outline',
            order: order ?? 0,
            isActive: isActive ?? true,
        });

        return res.status(201).json(option);
    } catch (err) {
        return res.status(500).json({ message: 'Could not create role option', error: err.message });
    }
};

// PUT /admin/settings/role-options/:id
exports.updateRoleOption = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, label, desc, icon, order, isActive } = req.body;

        const option = await RoleOption.findById(id);
        if (!option) {
            return res.status(404).json({ message: 'Role option not found' });
        }

        // if role key is being changed, make sure new one isn't taken
        if (role && role.toLowerCase().trim() !== option.role) {
            const clash = await RoleOption.findOne({ role: role.toLowerCase().trim() });
            if (clash) {
                return res.status(409).json({ message: `Role option "${role}" already exists` });
            }
            option.role = role.toLowerCase().trim();
        }

        if (label !== undefined) option.label = label;
        if (desc !== undefined) option.desc = desc;
        if (icon !== undefined) option.icon = icon;
        if (order !== undefined) option.order = order;
        if (isActive !== undefined) option.isActive = isActive;

        await option.save();
        return res.status(200).json(option);
    } catch (err) {
        return res.status(500).json({ message: 'Could not update role option', error: err.message });
    }
};

// DELETE /admin/settings/role-options/:id
exports.deleteRoleOption = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await RoleOption.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Role option not found' });
        }
        return res.status(200).json({ message: 'Role option deleted' });
    } catch (err) {
        return res.status(500).json({ message: 'Could not delete role option', error: err.message });
    }
};

// PATCH /admin/settings/role-options/reorder
// body: { order: [{ id, order }, ...] }
exports.reorderRoleOptions = async (req, res) => {
    try {
        const { order } = req.body;
        if (!Array.isArray(order)) {
            return res.status(400).json({ message: 'order must be an array of { id, order }' });
        }

        await Promise.all(
            order.map(({ id, order: ord }) =>
                RoleOption.findByIdAndUpdate(id, { order: ord })
            )
        );

        return res.status(200).json({ message: 'Order updated' });
    } catch (err) {
        return res.status(500).json({ message: 'Could not reorder role options', error: err.message });
    }
};