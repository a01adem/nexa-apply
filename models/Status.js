// models/Status.js
const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
    isOpen: {
        type: Boolean,
        default: true, // افتراضيًا، تكون الحالة مفتوحة
    },
});

module.exports = mongoose.model('Status', StatusSchema);
