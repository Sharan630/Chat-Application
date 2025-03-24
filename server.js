const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

const activeUsers = {};

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('user_join', (username) => {
    activeUsers[socket.id] = username;
    socket.emit('login_success', socket.id);
    io.emit('user_list', Object.values(activeUsers));
    io.emit('message', {
      id: Date.now(),
      type: 'system',
      text: `${username} has joined the chat`,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send_message', (messageData) => {
    const message = {
      id: Date.now(),
      user: activeUsers[socket.id],
      userId: socket.id,
      text: messageData.text,
      timestamp: new Date().toISOString(),
      type: 'user'
    };
    io.emit('message', message);
  });
 
  socket.on('typing', (isTyping) => {
    if (activeUsers[socket.id]) {
      socket.broadcast.emit('user_typing', {
        username: activeUsers[socket.id],
        isTyping
      });
    }
  });

  socket.on('disconnect', () => {
    const username = activeUsers[socket.id];
    if (username) {
      io.emit('message', {
        id: Date.now(),
        type: 'system',
        text: `${username} has left the chat`,
        timestamp: new Date().toISOString()
      });
      delete activeUsers[socket.id];
      io.emit('user_list', Object.values(activeUsers));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});