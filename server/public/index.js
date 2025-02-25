window.onload = () => {
  const socket = io();

  const sendBtn = document.getElementById("send");
  const messageInput = document.getElementById("data");
  const messagesContainer = document.getElementById("messages-container");
  const userNotifications = document.getElementById("user-notifications");
  let username = "";

  let name = prompt("Escribe tu nombre: ");

  //envio mensaje al servidor
  sendBtn.addEventListener("click", () => {
    const messageText = messageInput.value.trim();
    if (messageText) {
      const messageData = { user: name, data: messageText };
      socket.emit("message", JSON.stringify(messageData));
      addMessageData(messageData, "user");
      messageInput.value = "";
    }
  });

  //envio mensaje al servidor con enter
  messageInput.addEventListener("keydown", (e) => {
    const messageText = messageInput.value.trim();
    if (messageInput.value.trim() != "" && e.key == "Enter") {
      const messageData = { user: name, data: messageText };
      socket.emit("message", JSON.stringify(messageData));
      addMessageData(messageData, "user");
      messageInput.value = "";
    }
  });

  // emito nombre al servidor
  if (name) {
    socket.emit("name", name);
  }

  // recibo nombre de usuario del servidor cuando se conecta
  socket.on("usernameConnected", (name) => {
    showUserNotification(`${name} se ha conectado`, "connected");
  });

  // recibo nombre de usuario del servidor cuando se desconecta
  socket.on("usernameDisconnected", (name) => {
    showUserNotification(`${name} se ha desconectado`, "disconnected");
  });

  // función para mostrar notificaciones de usuario
  function showUserNotification(message, type) {
    const notificationDiv = document.createElement("div");
    notificationDiv.classList.add("user-notification", type);
    notificationDiv.textContent = message;
    userNotifications.appendChild(notificationDiv);

    // Eliminar automáticamente la notificación después de 3 segundos
    setTimeout(() => {
      notificationDiv.remove();
    }, 3000);
  }

  // recibo mensaje del servidor
  socket.on("messageServidor", (data) => {
    const receivedData = JSON.parse(data);
    receiveMessageData(receivedData, "other");
  });

  // funcion para agregar un mensaje a la interfaz
  function addMessageData(messageData, type) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type); // añadir clases para estilo
    messageDiv.textContent = `${messageData.data}`;
    messagesContainer.appendChild(messageDiv);

    // desplazar automáticamente hacia el último mensaje
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // funcion para agregar un mensaje a la interfaz
  function receiveMessageData(messageData, type) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", type); // añadir clases para estilo
    messageDiv.textContent = `${messageData.user}: ${messageData.data}`;
    messagesContainer.appendChild(messageDiv);

    // desplazar automaticamente hacia el último msj
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
};
