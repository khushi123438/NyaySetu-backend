// ================= IMPORTS =================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const session = require("express-session");

// Node-fetch fix ⭐⭐
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// ================= APP =================
const app = express();
const PORT = process.env.PORT || 5000;

// ================= CORS (Netlify Compatible) =================
app.use(
  cors({
    origin: [
       "http://localhost:3000",
      "https://nyaysetu-fr.netlify.app"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= SESSIONS =================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-nyayasetu",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // ⭐ for Render + HTTPS
      httpOnly: true,
      sameSite: "none", // ⭐ required for Netlify ↔ Render cookies
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ================= STATIC UPLOADS FOLDER =================
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use("/uploads", express.static(uploadsDir)); 

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ================= USERS FILE =================
const USERS_FILE = path.join(__dirname, "users.json");

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8") || "[]");
  } catch (error) {
    console.error("Error reading users", error);
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ================= ROOT ==========================
app.get("/", (req, res) => {
  res.send("NyayaSetu Backend Running Successfully ✔");
});

// ================= NEWS API ======================
const NEWS_API_KEY = process.env.NEWS_API_KEY;

app.get("/news", async (req, res) => {
  try {
    const apiURL = `https://newsapi.org/v2/top-headlines?country=in&category=general&apiKey=${NEWS_API_KEY}`;

    const response = await fetch(apiURL);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("News fetch error:", error);
    res.status(500).json({ error: "Unable to fetch news" });
  }
});

// ================= SIGNUP ======================
app.post("/signup", upload.single("photo"), (req, res) => {
  try {
    const users = readUsers();
    const body = req.body;
    const hashed = bcrypt.hashSync(body.password, 10);

    if (users.find((u) => u.email === body.email)) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const newUser = {
      id: Date.now().toString(),
      fullname: body.fullname || "",
      email: body.email || "",
      password: hashed,
      mobile: body.mobile || "",
      city: body.city || "",
      state: body.state || "",
      pincode: body.pincode || "",
      role: body.role || "User",
      barid: body.barid || "",
      specialization: body.specialization || "",
      experience: body.experience || "",
      image: req.file ? `/uploads/${req.file.filename}` : "",
    };

    users.push(newUser);
    writeUsers(users);

    req.session.loggedIn = true;
    req.session.email = newUser.email;

    res.json({
      success: true,
      user: { email: newUser.email, fullname: newUser.fullname },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= LOGIN ======================
app.post("/login", (req, res) => {
  try {
    const users = readUsers();
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email);
    if (!user)
      return res.json({ success: false, message: "Invalid credentials" });

    const match = bcrypt.compareSync(password, user.password);
    if (!match)
      return res.json({ success: false, message: "Invalid credentials" });

    req.session.loggedIn = true;
    req.session.email = user.email;

    res.json({
      success: true,
      user: { email: user.email, fullname: user.fullname },
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ================= CHECK SESSION =====================
app.get("/session", (req, res) => {
  res.json({
    loggedIn: !!req.session.loggedIn,
    email: req.session.email || null,
  });
});

// ================= LOGOUT ===========================
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ================= ADVOCATES ========================
app.get("/advocates", (req, res) => {
  try {
    const users = readUsers();
    const advocates = users
      .filter((u) => (u.role || "").toLowerCase() === "advocate")
      .map((u) => ({
        fullname: u.fullname,
        email: u.email,
        specialization: u.specialization,
        experience: u.experience,
        city: u.city,
        state: u.state,
        barid: u.barid,
        image: u.image,
      }));

    res.json(advocates);
  } catch (error) {
    console.error("Advocates error:", error);
    res.status(500).json([]);
  }
});

// ================= START SERVER =====================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
