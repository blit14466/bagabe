const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const session = require("express-session");

app.use(session({
    secret: "50007CEE", // Change this to a secure random string
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // Keep this for static files like CSS/JS/images

// Serve the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html")); // Removed "views"
});

// Serve the signup page
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "signup.html"));
});
app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    if (users[email]) {
        return res.status(400).send("User already exists!");
    }
    users[email] = { username, email, password };
    req.session.user = users[email]; // Store user session
    res.redirect("/dashboard"); // Redirect to dashboard
});

// Serve the login page
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;
    if (!users[email] || users[email].password !== password) {
        return res.status(401).send("Invalid email or password!");
    }
    req.session.user = users[email]; // Store user session
    res.redirect("/dashboard");
});

// Serve the dashboard
app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Serve the settings page
app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "settings.html"));
});
app.post("/settings", (req, res) => {
    const { message_privacy, friend_list_privacy, email_privacy, online_status, theme, language } = req.body;
    res.send("Settings updated successfully! <a href='/settings'>Go back</a>");
});

// Temporary in-memory user storage
const users = {};

// Deactivate an account
app.post("/deactivate-account", (req, res) => {
    const { userId } = req.body;
    if (users[userId]) {
        users[userId].active = false;
        res.send("Account deactivated successfully.");
    } else {
        res.status(404).send("User not found.");
    }
});

// Delete an account permanently
app.post("/delete-account", (req, res) => {
    const { userId } = req.body;
    if (users[userId]) {
        delete users[userId];
        res.send("Account deleted permanently.");
    } else {
        res.status(404).send("User not found.");
    }
});

// Serve the chat page
app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "chat.html"));
});

// Handle socket connection for real-time messaging
io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("chat message", (msg) => {
        io.emit("chat message", msg);
    });
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

io.on("connection", (socket) => {
    console.log("A user connected");
    socket.on("chat message", (msg, userId) => {
        io.emit("chat message", msg);
        addNotification(userId, `New message: ${msg}`);
    });
    socket.on("friend request", (userId, friendId) => {
        addNotification(friendId, `You have a new friend request from user ${userId}`);
    });
    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Serve the profile page
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "profile.html"));
});

// Logout route
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

const notifications = {}; // Temporary in-memory storage for notifications

// Function to add notifications
function addNotification(userId, message) {
    if (!notifications[userId]) {
        notifications[userId] = [];
    }
    notifications[userId].push(message);
    io.emit("notification", { userId, message });
}

// Start the server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});
