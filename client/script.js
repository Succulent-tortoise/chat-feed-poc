// Frontend Socket.io integration for chat feed - with enhancements
const socket = io(); // Connects automatically to http://localhost:3000

const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');

// Simple user placeholder (expand later)
const user = prompt('Enter your username:') || 'Anonymous';

// Function to add a message to the DOM
function addMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  const time = new Date(message.timestamp).toLocaleString(); // Better formatting
  messageElement.innerHTML = `
    <strong>${message.user}</strong> (${time}): ${message.text}
  `;
  messagesDiv.appendChild(messageElement);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to bottom
}

// Clear all messages
function clearChat() {
  messagesDiv.innerHTML = '';
  socket.emit('clear-chat');
}

// Load existing messages on connection
socket.on('load-messages', (messages) => {
  messagesDiv.innerHTML = ''; // Clear any placeholders
  messages.forEach(addMessage);
});

// Handle new incoming messages (from any client)
socket.on('new-message', (message) => {
  addMessage(message);
});

// Handle clear from server
socket.on('clear-chat', () => {
  messagesDiv.innerHTML = '';
});

// Handle errors
socket.on('error', (err) => {
  alert(err.message); // Simple popup for POC
  console.error('Chat error:', err);
});

// Send message on button click or Enter key with client validation
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || text.length > 500) {
    alert('Message must be 1-500 characters.');
    messageInput.value = '';
    return;
  }
  socket.emit('new-message', { user, text });
  messageInput.value = ''; // Clear input
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Add clear button (optional for testing)
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear Chat';
clearButton.onclick = clearChat;
clearButton.style.marginLeft = '10px';
document.getElementById('chat-container').appendChild(clearButton);

// Optional: Log connection status
socket.on('connect', () => {
  console.log('Connected to server as', user);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
