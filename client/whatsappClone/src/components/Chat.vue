<template>
  <div class="container">
    <div class="chat-list">
      <h2>Usuarios Conectados</h2>        
      <ul>
        <li
          @click="changeChat('group')"
          :class="{ active: activeChat === 'group' }"
        >
          📢 Grupo General
        </li>
        <li 
          v-for="user in usersConnected.filter(u => u.id !== socket.id)" 
          :key="user.id"
          @click="changeChat(user.id)"
          :class="{ active: activeChat === user.id }"
        >
          {{ user.name }}
        </li>
      </ul>
    </div>

    <div class="chat-area">
      <div class="chat-header">
        <img src="../assets/img/whatsappLogo.png" alt="Imagen del chat" />
        <h1>{{ activeChat === "group" ? "Grupo General" : getChatName(activeChat) }}</h1>
      </div>

      <div id="user-notifications">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['user-notification', notification.type]"
        >
          {{ notification.message }}
        </div>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div
          v-for="message in currentMessages"
          :key="message.id"
          :class="['message', message.type]"
        >
          <template v-if="message.type === 'other'">
            <strong>{{ message.user }}:</strong> {{ message.data }}
          </template>
          <template v-else>
            {{ message.data }}
          </template>
        </div>
        <div v-if="typingUser" class="typing-notification">
          <strong>{{ typingUser }}</strong> está escribiendo...
        </div>
      </div>

      <div class="input-area">
        <input
          v-model="newMessage"
          @input="handleTyping"
          @keydown.enter="sendMessage"
          type="text"
          placeholder="Escribe un mensaje..."
          id="data"
        />
        <button @click="sendMessage" id="send">
          <img src="../assets/img/enviar.png" alt="Enviar" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from "socket.io-client";

export default {
  data() {
    return {
      socket: null,
      name: "",
      newMessage: "",
      messages: [],
      notifications: [],
      privateMessages: {},
      usersConnected: [],
      userIdToName: {},
      activeChat: "group",
      typingUser: null,  
      typingTimeout: null,  
    };
  },
  computed: {
    currentMessages() {
      return this.activeChat === "group"
        ? this.messages
        : this.privateMessages[this.activeChat] || [];
    },
  },
  mounted() {
    this.socket = io("https://whatsapp-mmgt.onrender.com");

    const storedName = localStorage.getItem("username");
    if (storedName) {
      this.name = storedName;
      this.socket.emit("name", this.name);
    } else {
      this.name = prompt("Escribe tu nombre:");
      if (this.name) {
        localStorage.setItem("username", this.name);
        this.socket.emit("name", this.name);
      }
    }

    this.socket.on("usersConnected", (users) => {
      this.usersConnected = users;
      this.userIdToName = users.reduce((acc, user) => {
        acc[user.id] = user.name;
        return acc;
      }, {});
    });

    this.socket.on("usernameConnected", (user) => {
      this.notifications.push({
        id: Date.now(),
        message: `${user.name} se ha conectado`,
        type: "connect",
      });

      // Hace que la notificación desaparezca después de 5 segundos
      setTimeout(() => {
        this.notifications.shift();
      }, 5000);
    });

    this.socket.on("usernameDisconnected", (user) => {
      this.notifications.push({
        id: Date.now(),
        message: `${user.name} se ha desconectado`,
        type: "disconnect",
      });

      setTimeout(() => {
        this.notifications.shift();
      }, 5000);
    });

    this.socket.on("messageServidor", (data) => {
      const receivedData = JSON.parse(data);
      this.receiveMessageData(receivedData, "other");
    });

    this.socket.on("privateMessage", ({ from, name, data }) => {
      if (!this.privateMessages[from]) {
        this.privateMessages[from] = [];
      }
      this.privateMessages[from].push({ user: name, data, type: "other" });

      // Notificación si el usuario está en otro chat
      if (this.activeChat !== from) {
        alert(`Nuevo mensaje de ${name}`);
      }
      this.$nextTick(this.scrollToBottom);
    });

    this.socket.on("userTyping", (name) => {
      this.typingUser = name;
    });

    // Escuchar cuando un usuario deja de escribir
    this.socket.on("userStoppedTyping", () => {
      this.typingUser = null;
    });

  },
  methods: {
    handleTyping() {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);  
      }

      this.socket.emit("typing", this.name);  

      this.typingTimeout = setTimeout(() => {
        this.socket.emit("stopTyping"); 
      }, 1500);
    },

    sendMessage() {
      const messageText = this.newMessage.trim();
      if (!messageText) return;

      if (this.activeChat === "group") {
        const messageData = { user: this.name, data: messageText };
        this.socket.emit("message", JSON.stringify(messageData));
        this.messages.push({ ...messageData, type: "user" });
      } else {
        // Enviar mensaje privado usando ID
        const privateMessageData = {
          from: this.socket.id, // usamos el ID del usuario
          name: this.name, // el nombre
          to: this.activeChat,  // ID del destinatario
          data: messageText,
        };
        this.socket.emit("privateMessage", privateMessageData);

        if (!this.privateMessages[this.activeChat]) {
          this.privateMessages[this.activeChat] = [];
        }
        
        this.privateMessages[this.activeChat].push({
          user: this.name,
          data: messageText,
          type: "user"
        });
      }

      this.newMessage = "";
      this.$nextTick(this.scrollToBottom);
    },
    receiveMessageData(messageData, type) {
      this.messages.push({ ...messageData, type });
      this.$nextTick(this.scrollToBottom);
    },
    changeChat(user) {
      this.activeChat = user;
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    },
    getChatName(chatId) {
      return this.userIdToName[chatId] || chatId;
    },
  },
};
</script>

<style scoped>
/* Título */
.chat-list h2 {
  font-size: x-large;
  font-weight: bold;
  color: #075e54;
  margin-bottom: 10px;
  text-align: center;
  border-bottom: 2px solid #25d366;
  padding-bottom: 5px;
}

/* Lista de usuarios */
.chat-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Estilo de cada usuario */
.chat-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 0.2rem;
  margin: 0.3rem 0.2rem;
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: large;
}

.chat-list li:hover {
  background: #f5f5f5;
}

.chat-list li::before {
  content: "👤";
  font-size: 24px;
}
</style>
