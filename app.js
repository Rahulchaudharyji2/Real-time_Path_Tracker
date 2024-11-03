const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Setup EJS and public directory
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

const connectedUsers = {}; // Object to keep track of connected users

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    
    // Store the user in the connectedUsers object
    connectedUsers[socket.id] = socket.id;

    // Emit the updated list of connected users to all clients
    io.emit("update-user-list", Object.keys(connectedUsers));

    socket.on("send-location", (data) => {
        // Broadcast the user's location to all clients
        io.emit("receive-location", { id: socket.id, ...data });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete connectedUsers[socket.id]; // Remove the user from the connected users list
        
        // Emit the updated list of connected users to all clients
        io.emit("update-user-list", Object.keys(connectedUsers));
        io.emit("user-disconnected", socket.id);
    });
});

// Route to render the main page
app.get("/", (req, res) => {
    res.render("index");
});

// Start the server
server.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
