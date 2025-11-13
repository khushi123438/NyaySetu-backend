const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'dev-secret-nyayasetu',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// ❌ REMOVED: app.use(express.static(path.join(__dirname, '..'))); 

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g,'_'))
});
const upload = multer({ storage });

const USERS_FILE = path.join(__dirname, 'users.json');
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const txt = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) { console.error('readUsers error', e); return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

const apiKey = 'e75268db7a254c9cac00a80e3b962cd9';
app.get('/news', async (req, res) => {
  try {
    const response = await fetch(`https://newsapi.org/v2/top-headlines?country=us&category=business&apiKey=${apiKey}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Error fetching news' });
  }
});

app.post('/signup', upload.single('photo'), (req, res) => {
  try {
    const users = readUsers();
    const body = req.body || {};
    const plainPassword = body.password || '';
    const hashed = bcrypt.hashSync(plainPassword, 10);

    const user = {
      id: Date.now().toString(),
      fullname: body.fullname || '',
      email: body.email || '',
      password: hashed,
      mobile: body.mobile || '',
      city: body.city || '',
      state: body.state || '',
      pincode: body.pincode || '',
      role: body.role || 'User',
      barid: body.barid || '',
      specialization: body.specialization || '',
      experience: body.experience || '',
      image: req.file ? ('/uploads/' + path.basename(req.file.path)) : ''
    };

    if (users.find(u => u.email === user.email)) {
      return res.json({ success: false, message: 'Email already registered' });
    }

    users.push(user);
    writeUsers(users);

    req.session.loggedIn = true;
    req.session.email = user.email;

    res.json({ success: true, user: { email: user.email, fullname: user.fullname } });
  } catch (err) {
    console.error('signup error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

  app.post('/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.json({ success: false, message: 'Invalid credentials' });

    const match = bcrypt.compareSync(password || '', user.password || '');
    if (!match) return res.json({ success: false, message: 'Invalid credentials' });

    req.session.loggedIn = true;
    req.session.email = user.email;
    res.json({ success: true, user: { email: user.email, fullname: user.fullname } });
  } catch (err) {
    console.error('login error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/session', (req, res) => {
  res.json({ loggedIn: !!req.session.loggedIn, email: req.session.email || null });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/advocates', (req, res) => {
  try {
    const users = readUsers();
    const advocates = users.filter(u => (u.role || '').toLowerCase() === 'advocate').map(u => ({
      fullname: u.fullname,
      email: u.email,
      specialization: u.specialization,
      experience: u.experience,
      city: u.city,
      state: u.state,
      barid: u.barid,
      image: u.image || ''
    }));
    res.json(advocates);
  } catch (err) {
    console.error('advocates error', err);
    res.status(500).json([]);
  }
});

// ✅ MODIFIED: app.get('*') ko app.get('/') se badal diya gaya
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, '..') });
});

// Agar koi aur unknown route aaye toh 404 error de
app.use((req, res) => {
    res.status(404).send('404 Not Found - Check your API routes.');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));