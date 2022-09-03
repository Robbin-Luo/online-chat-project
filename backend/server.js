const express = require('express')
const path = require('path')
const { Server } = require('socket.io')
const http = require('http')
require('dotenv').config()


const app = express();
app.use(express.static(path.join(__dirname, "/frontend/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/frontend/build/index.html"))
});

const httpServer = http.Server(app);

const io = new Server(httpServer, { cors: { orgin: '*' } });
const users = [];

io.on('connection', (socket) => {
  socket.on('onLogin', user => {
    const updatedUser = { ...user, online: true, socketId: socket.id, messages: [] };
    const existUser = users.find((u) => u.name === updatedUser.name);
    if (existUser) {
      existUser.socketId = socket.id;
      existUser.online = true;
    } else {
      users.push(updatedUser);
    }

    const admin = users.find((u) => u.name === 'Admin' && u.online);
    if (admin) {
      io.to(admin.socketId).emit('updateUser', updatedUser)
    };
    if (updatedUser.name === 'Admin') {
      io.to(updatedUser.socketId).emit('listUsers', users)
    }
  });

  socket.on('disconnect', () => {
    const user = users.find((u) => u.socketId === socket.id);
    if (user) {
      user.online = false;
      const admin = users.find((u) => u.name === 'Admin' && u.online);
      if (admin) {
        io.to(admin.socketId).emit('updateUser', user);
      }
    }
  });

  socket.on('onUserSelected', user => {
    const admin = users.find((u) => u.name === 'Admin' && u.online);
    if (admin) {
      const existUser = users.find((u) => u.name === user.name);
      io.to(admin.socketId).emit('selectUser', existUser);
    }
  });

  socket.on('onMessage', message => {
    if (message.from === 'Admin') {
      const user = users.find((u) => u.name === message.to && u.online)
      if (user) {
        io.to(user.socketId).emit('message', message);
          user.messages.push(message);
      } else {
        io.to(socket.id).emit('message', {
          from: 'System', to: 'Admin', body: 'User is not online'
        })
      }
    } else {
      const admin = users.find((u) => u.name === 'Admin' && u.online);
      if (admin) {
        io.to(admin.socketId).emit('message', message);
        const user = users.find((u) => u.name === message.from && u.online)
        if (user) {
            user.messages.push(message);
        }
      } else {
        io.to(socket.id).emit('message', { from: 'System', to: message.from, body: 'Sorry. Admin is not online now' })
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`server is running at http://localhost:${port}`)
})