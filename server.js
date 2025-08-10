require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const app = express();

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
// It's crucial to have a secret for signing cookies.
const COOKIE_SECRET = process.env.COOKIE_SECRET;
const IMAGES_DIR = path.join(__dirname, 'images');

// --- Pre-flight Checks ---
if (!ADMIN_PASSWORD) {
    console.error('FATAL ERROR: ADMIN_PASSWORD environment variable is not set.');
    process.exit(1);
}
if (!COOKIE_SECRET) {
    console.error('FATAL ERROR: COOKIE_SECRET environment variable is not set. Please add it to your .env file.');
    process.exit(1);
}

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));

// --- Authentication Middleware ---
const checkAuth = (req, res, next) => {
    if (req.signedCookies.session_token === 'valid') {
        return next();
    }
    res.redirect('/login');
};

// --- Static File Routes ---
// Publicly accessible assets
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.get('/js/gallery.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'js', 'gallery.js'));
});

// Protected assets, like the control panel script
app.get('/js/control.js', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'js', 'control.js'));
});


// --- Page and API Routes ---

// Public pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.cookie('session_token', 'valid', {
            signed: true,
            httpOnly: true,
            maxAge: 10 * 24 * 60 * 60 * 1000, // 10 days
            sameSite: 'strict'
        });
        res.redirect('/control');
    } else {
        res.redirect('/login?error=1');
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('session_token');
    res.redirect('/login');
});

// Protected routes
app.get('/control', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'control.html'));
});

// Multer setup
const storage = multer.diskStorage({
    destination: IMAGES_DIR,
    filename: (req, file, cb) => {
        const slot = req.query.slot;
        // Basic validation, assuming checkAuth and other validations happen before
        cb(null, `slot${slot}.jpg`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const mimetype = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error(`Error: File upload only supports the following filetypes - ${allowedTypes}`));
    }
}).single('file'); // 'file' is the field name in the form

app.post('/upload', checkAuth, (req, res) => {
    const slot = req.query.slot;
    if (!slot || !/^[1-9]|1[0-2]$/.test(slot)) {
        return res.status(400).json({ success: false, message: 'Invalid or missing slot parameter.' });
    }

    upload(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        // TODO: Add SSE event, versioning, etc.
        res.status(200).json({ success: true, message: `Slot ${slot} updated successfully.` });
    });
});

// --- Server ---
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Gallery: http://localhost:${PORT}`);
    console.log(`Control Panel: http://localhost:${PORT}/control`);
});