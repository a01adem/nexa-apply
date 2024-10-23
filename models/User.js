const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // معرف المستخدم ويجب أن يكون فريدًا
    name: { type: String, required: true }, // اسم المستخدم
    status: { type: String, enum: ['accepted', 'rejected'], required: true }, // حالة المستخدم (مقبول أو مرفوض)
}, { timestamps: true }); // إضافة تاريخ الإنشاء والتحديث تلقائياً

const User = mongoose.model('User', userSchema);
module.exports = User;
