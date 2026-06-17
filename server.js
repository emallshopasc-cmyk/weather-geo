const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin panel üçün şifrə (istədiyin kimi dəyiş)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Məlumatları saxlamaq üçün fayl
const DATA_FILE = path.join(__dirname, 'data', 'visitors.json');

// Data qovluğunu yarat
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ana səhifə
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// İstifadəçi məlumatlarını qəbul et
app.post('/api/visitor', (req, res) => {
    const { ip, isp, lat, lon, city, country, device, browser, timestamp } = req.body;

    const visitors = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    visitors.unshift({
        id: Date.now(),
        ip: ip || 'Naməlum',
        isp: isp || 'Naməlum',
        lat: lat || null,
        lon: lon || null,
        city: city || 'Naməlum',
        country: country || 'Naməlum',
        device: device || 'Naməlum',
        browser: browser || 'Naməlum',
        timestamp: timestamp || new Date().toISOString()
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(visitors, null, 2));
    res.json({ success: true });
});

// Admin login
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true, token: Buffer.from(ADMIN_PASSWORD).toString('base64') });
    } else {
        res.status(401).json({ success: false, message: 'Yanlış şifrə' });
    }
});

// Admin - bütün məlumatları al
app.get('/api/admin/visitors', (req, res) => {
    const token = req.headers.authorization;
    if (token !== Buffer.from(ADMIN_PASSWORD).toString('base64')) {
        return res.status(401).json({ success: false, message: 'İcazəsiz giriş' });
    }

    const visitors = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json({ success: true, visitors, total: visitors.length });
});

// Admin - məlumatları sil
app.delete('/api/admin/visitors/:id', (req, res) => {
    const token = req.headers.authorization;
    if (token !== Buffer.from(ADMIN_PASSWORD).toString('base64')) {
        return res.status(401).json({ success: false, message: 'İcazəsiz giriş' });
    }

    let visitors = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    visitors = visitors.filter(v => v.id !== parseInt(req.params.id));
    fs.writeFileSync(DATA_FILE, JSON.stringify(visitors, null, 2));
    res.json({ success: true });
});

// Admin - hamısını sil
app.delete('/api/admin/visitors', (req, res) => {
    const token = req.headers.authorization;
    if (token !== Buffer.from(ADMIN_PASSWORD).toString('base64')) {
        return res.status(401).json({ success: false, message: 'İcazəsiz giriş' });
    }

    fs.writeFileSync(DATA_FILE, '[]');
    res.json({ success: true });
});

// Admin panel səhifəsi
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir`);
});
