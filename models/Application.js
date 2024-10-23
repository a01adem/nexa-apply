const mongoose = require('mongoose');

// تعريف نموذج الطلب
const applicationSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // حقل لتخزين معرف المستخدم
    name: { type: String, required: true },   // حقل لتخزين الاسم
    age: { type: Number, required: true },    // حقل لتخزين العمر
    country: { type: String, required: true }, // حقل لتخزين البلد
    experience: { type: String, required: true }, // حقل لتخزين الخبرات
}, { timestamps: true }); // إضافة حقل timestamps لتتبع تاريخ الإنشاء والتحديث

// تصدير نموذج Application
module.exports = mongoose.model('Application', applicationSchema);
