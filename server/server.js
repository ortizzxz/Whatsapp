const express = require("express");
const { createServer } = require("node:http");
const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;
const path = require("path");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "https://whatsapp-front-end-two.vercel.app/",
    methods: ["GET", "POST"],
  },
});

const users = {}; // { nombreUsuario: socketId }
const sockets = {}; // { socketId: nombreUsuario }

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

io.on("connection", (socket) => {
  console.log(
    "A user connected, total users connected: " + io.engine.clientsCount
  );

  // gguarda el nombre del usuario y su socket ID
  socket.on("name", (name) => {
    const userId = socket.id; // Usamos el ID único del socket
    users[userId] = { name, id: userId }; // Guardamos ID y nombre
    sockets[socket.id] = userId; // Relacionamos el socket con el usuario

    io.emit("usersConnected", Object.values(users)); // Enviamos toda la lista de usuarios
    socket.broadcast.emit("usernameConnected", { name, id: userId });
  });

  socket.on("message", (data) => {
    socket.broadcast.emit("messageServidor", data);
  });

  socket.on("typing", (name) => {
    console.log(name + ' esta escribiendo');
    socket.broadcast.emit("userTyping", name);
  });

  socket.on("stopTyping", () => {
    console.log('ha dejado de escribir');
    socket.broadcast.emit("userStoppedTyping");
  });

  socket.on("privateMessage", ({ from, name, to, data }) => {
    console.log(from + ", " + name + ", " + to + ", " + data)
    const receiverSocketId = to;

    if (io.sockets.sockets.get(receiverSocketId)) {
      io.to(receiverSocketId).emit("privateMessage", { from, name, data });
    } else {
      console.log(`Usuario con ID ${to} no encontrado.`);
    }
  });

  socket.on("disconnect", () => {
    const userId = sockets[socket.id];
    if (userId) {
      const disconnectedUser = users[userId];
      delete users[userId];
      delete sockets[socket.id];

      socket.broadcast.emit("usernameDisconnected", disconnectedUser);
      io.emit("usersConnected", Object.values(users));
    }
  });
});

app.use(express.static(path.join(__dirname, "public")));

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://localhost:${port}`);
});

