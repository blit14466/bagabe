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
app.use(express.static("public"));

// Serve the home page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

// Serve the signup page
app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "signup.html"));
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
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!users[email] || users[email].password !== password) {
        return res.status(401).send("Invalid email or password!");
    }

    req.session.user = users[email]; // Store user session
    res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }
    res.sendFile(__dirname + "/views/dashboard.html");
});

// Serve the settings page
app.get("/settings", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "settings.html"));
});

// Handle form submissions for settings
app.post("/settings", (req, res) => {
    const { message_privacy, friend_list_privacy, email_privacy, online_status, theme, language } = req.body;
    // Save these settings in a database later
    res.send("Settings updated successfully! <a href='/settings'>Go back</a>");
});

// Temporary in-memory user storage (Replace with a database later)
const users = {};

// Route to deactivate an account
app.post("/deactivate-account", (req, res) => {
    const { userId } = req.body;
    if (users[userId]) {
        users[userId].active = false;
        res.send("Account deactivated successfully.");
    } else {
        res.status(404).send("User not found.");
    }
});

// Route to delete an account permanently
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
    res.sendFile(path.join(__dirname, "views", "chat.html"));
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

    // Listen for chat messages
    socket.on("chat message", (msg, userId) => {
        io.emit("chat message", msg);
        addNotification(userId, `New message: ${msg}`);
    });

    // Listen for friend requests
    socket.on("friend request", (userId, friendId) => {
        addNotification(friendId, `You have a new friend request from user ${userId}`);
    });

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

// Serve the profile page (this is a placeholder, you will need a real user profile system)
app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "profile.html"));
});

// Logout route (this is just a placeholder, session management will be added later)
app.get("/logout", (req, res) => {
    res.send("Logged out. <a href='/'>Go to Home</a>");
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

const notifications = {}; // A simple in-memory storage for notifications

// Add a notification for a user
function addNotification(userId, message) {
    if (!notifications[userId]) {
        notifications[userId] = [];
    }
    notifications[userId].push(message);
    io.emit("notification", { userId, message });
}

// Temporry user storage

// Start the server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});