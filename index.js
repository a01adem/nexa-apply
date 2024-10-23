require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const mongoose = require('mongoose');

const { Client, GatewayIntentBits } = require('discord.js'); // استيراد Discord.js

const app = express();
const PORT = process.env.PORT || 3000;
const config = require('./config');

// إعداد Mongoose
mongoose.connect(config.mongoDb, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// إعداد EJS كـ template engine
app.set('view engine', 'ejs');
// Middleware to parse application/json
app.use(express.json());

// Middleware to parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
// إعداد الجلسات
app.use(session({
    secret: 'your_secret_key', // يمكنك تغيير هذا إلى مفتاح سري أقوى
    resave: false,
    saveUninitialized: false,
}));

// تهيئة passport
app.use(passport.initialize());
app.use(passport.session());

// إعداد استراتيجية Discord
passport.use(new DiscordStrategy({
    clientID: config.clientId,
    clientSecret: config.clientSecret,
    callbackURL: config.callbackUrl,
    scope: ['identify', 'email'],
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// إعداد الصفحات
// إعداد الصفحات
app.get('/', (req, res) => {
    res.render('index', { user: req.user, config: config });
});

app.get('/404', (req, res) => {
    res.render('404');
});
app.get('/403', (req, res) => {
    res.render('403');
});
app.get('/login', (req, res) => {
    res.redirect('/auth/discord');
});

// مسار إعادة التوجيه إلى Discord
app.get('/auth/discord', passport.authenticate('discord'));

// مسار رد الاتصال من Discord
app.get('/auth/discord/callback', passport.authenticate('discord', {
    successRedirect: '/',
    failureRedirect: '/',
}));

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/');
    });
});

// تأكد

// عرض نموذج التقديم
const Application = require('./models/Application');

// عرض نموذج التقديم

const User = require('./models/User'); // تأكد من استيراد نموذج User

app.get('/apply', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    try {
        // تحقق إذا كان المستخدم موجودًا في قاعدة بيانات User
        const existingUser = await User.findOne({ userId: req.user.id });

        if (existingUser) {
            // إذا كان المستخدم مقبولًا
            if (existingUser.status === 'accepted') {
                return res.render('accepted'); // تأكد من وجود ملف accepted.ejs لعرض حالة القبول
            }

            // إذا كان المستخدم مرفوضًا
            if (existingUser.status === 'rejected') {
                return res.render('rejected'); // تأكد من وجود ملف rejected.ejs لعرض حالة الرفض
            }
        }

        // تحقق إذا كان هناك طلب سابق
        const existingApplication = await Application.findOne({ userId: req.user.id });

        if (existingApplication) {
            // إذا كان هناك طلب سابق ولم يتم قبوله أو رفضه بعد، عرض صفحة "تم التقديم بنجاح"
            return res.render('submitted'); // تأكد من وجود ملف submitted.ejs لعرض حالة التقديم
        }

        // إذا لم يقدم طلبًا بعد، عرض صفحة التقديم
        let status = await Status.findOne();
        res.render('apply', { status: status});
    } catch (err) {
        console.error(err);
        return res.status(500).send('حدث خطأ أثناء التحقق من الطلب.');
    }
});

// مسار معالجة تقديم الطلب
app.post('/submit-application', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    try {
        // تحقق إذا كان المستخدم قد قدم طلبًا سابقًا
        const existingApplication = await Application.findOne({ userId: req.user.id });

        if (existingApplication) {
            // إذا كان هناك طلب سابق، عرض صفحة "تم التقديم بنجاح"
            return res.render('submitted'); // تأكد من وجود ملف `submitted.ejs`
        }

        // إذا لم يقدم طلبًا بعد، إنشاء طلب جديد
        const newApplication = new Application({
            userId: req.user.id, // معرف المستخدم
            name: req.body.name,
            age: req.body.age,
            country: req.body.country,
            experience: req.body.experience
        });

        await newApplication.save(); // حفظ الطلب الجديد

        // بعد الحفظ بنجاح، عرض صفحة "تم التقديم بنجاح"
        res.render('submitted');
    } catch (err) {
        console.error(err);
        return res.status(500).send('حدث خطأ أثناء حفظ الطلب.');
    }
});

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });




app.get('/admin', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    // تحقق مما إذا كان معرف المستخدم ضمن المسموح لهم
    if (!config.admins.includes(req.user.id)) {
        return res.status(403).redirect('/403');
    }

    try {
        // جلب جميع المتقدمين من قاعدة البيانات
        const applicants = await Application.find({});

        // جلب حالة التقديم
        let status = await Status.findOne();

        // إذا لم يكن هناك سجل حالة، أنشئ سجل جديد بفتح التقديم بشكل افتراضي
        if (!status) {
            status = new Status({ isOpen: true });
            await status.save(); // احفظ الحالة الجديدة في قاعدة البيانات
        }

        // عرض صفحة admin وتمرير بيانات المتقدمين وحالة التقديم إلى الـ template
        res.render('admin', { applicants, status });
    } catch (err) {
        console.error(err);
        return res.status(500).send('حدث خطأ أثناء جلب بيانات المتقدمين.');
    }
});


app.post('/accept-applicant/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    const applicantId = req.params.id;

    try {
        const applicant = await Application.findById(applicantId);
        if (!applicant) {
            return res.status(404).send('المتقدم غير موجود');
        }

        // إضافة رتبة للمتقدم المقبول
        const guild = client.guilds.cache.get(config.guildId);
        const member = await guild.members.fetch(applicant.userId);

        if (member) {
            const role = guild.roles.cache.get(config.roles.supportId); // استخدام معرف الرتبة
            if (role) {
                await member.roles.add(role);

                // حذف المتقدم من قاعدة البيانات بعد إعطائه الرتبة
                await Application.findByIdAndDelete(applicantId);

                // حفظ حالة المستخدم في قاعدة بيانات User
                await User.findOneAndUpdate(
                    { userId: applicant.userId },
                    { name: applicant.name, status: 'accepted' },
                    { upsert: true } // إذا لم يكن موجودًا، سيتم إنشاؤه
                );

                // إرجاع استجابة للفتح modal
                return res.json({ success: true, message: `تم قبول المتقدم ${applicant.name} ومنحه الرتبة وحذفه من قاعدة البيانات` });
            } else {
                return res.json({ success: false, message: 'لم يتم العثور على الرتبة' });
            }
        } else {
            return res.json({ success: false, message: 'لم يتم العثور على العضو' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).send('حدث خطأ أثناء معالجة الطلب.');
    }
});

// مسار الرفض
app.post('/reject-applicant/:id', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    const applicantId = req.params.id;

    try {
        const applicant = await Application.findById(applicantId);
        if (!applicant) {
            return res.status(404).send('المتقدم غير موجود');
        }

        // حذف المتقدم من قاعدة البيانات
        await Application.findByIdAndDelete(applicantId);

        // حفظ حالة المستخدم في قاعدة بيانات User
        await User.findOneAndUpdate(
            { userId: applicant.userId },
            { name: applicant.name, status: 'rejected' },
            { upsert: true } // إذا لم يكن موجودًا، سيتم إنشاؤه
        );

        res.json({ success: true, message: `تم رفض المتقدم ${applicant.name} وحذفه من قاعدة البيانات.` });
    } catch (err) {
        console.error(err);
        return res.status(500).send('حدث خطأ أثناء معالجة الطلب.');
    }
});


const Status = require('./models/Status'); // تأكد من استيراد النموذج

// إعداد نقطة نهاية لجلب الحالة الحالية
app.get('/get-status', async (req, res) => {
    try {
        const status = await Status.findOne();
        res.json({ success: true, status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء جلب الحالة.' });
    }
});

// إعداد نقطة نهاية لتحديث حالة التقديم
app.post('/update-status', async (req, res) => {
    const { isOpen } = req.body;

    try {
        let status = await Status.findOne();
        if (status) {
            status.isOpen = isOpen;
            await status.save();
        } else {
            status = new Status({ isOpen });
            await status.save();
        }
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'حدث خطأ أثناء تحديث الحالة.' });
    }
});

// بدء السيرفر
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
client.login(config.token);
