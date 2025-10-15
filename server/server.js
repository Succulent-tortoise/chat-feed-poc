// Initial server setup - expanded for message handling with enhancements
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs'); // Built-in: For JSON persistence

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000", // Allow frontend origin for POC
    methods: ["GET", "POST"]
  }
});

// File for persistence (simple JSON in project root)
const messagesFile = path.join(__dirname, '../messages.json');

// In-memory message store (loaded from/saved to file)
let messages = [];
let messageId = 1;

// Load messages from file on startup
function loadMessages() {
  try {
    if (fs.existsSync(messagesFile)) {
      const data = fs.readFileSync(messagesFile, 'utf8');
      const parsed = JSON.parse(data);
      messages = parsed.messages || [];
      messageId = parsed.nextId || 1;
      console.log(`Loaded ${messages.length} messages from file.`);
    } else {
      console.log('No messages file found; starting fresh.');
    }
  } catch (err) {
    console.error('Error loading messages:', err);
    messages = [];
    messageId = 1;
  }
}

// Save messages to file (on new message)
function saveMessages() {
  try {
    const data = { messages, nextId: messageId };
    fs.writeFileSync(messagesFile, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error saving messages:', err);
  }
}

// Serve static files from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Fallback root route: Serve index.html explicitly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send existing messages to new client
  socket.emit('load-messages', messages);

  // Handle new message from client with validation
  socket.on('new-message', (data) => {
    const text = (data.text || '').trim();
    if (!text || text.length > 500) { // Validation: No empty or too long
      socket.emit('error', { message: 'Message must be 1-500 characters.' });
      return;
    }
    const newMessage = {
      id: messageId++,
      user: (data.user || 'Anonymous').substring(0, 20), // Sanitize user
      text: text, // Already trimmed
      timestamp: new Date().toISOString()
    };
    messages.push(newMessage);
    saveMessages(); // Persist to file
    // Broadcast to all clients
    io.emit('new-message', newMessage);
    console.log('New message:', newMessage);
  });

  // Handle clear chat (from client)
  socket.on('clear-chat', () => {
    messages = [];
    messageId = 1;
    saveMessages();
    io.emit('clear-chat');
    console.log('Chat cleared by client:', socket.id);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Load messages on server start
loadMessages();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.io ready for real-time chat.`);
});
