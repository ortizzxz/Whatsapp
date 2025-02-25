import { createApp } from "vue";
import App from "./App.vue";
import { io } from "socket.io-client";
import './assets/styles.css'
const socket = io("http://localhost:3000"); 

const app = createApp(App);

app.config.globalProperties.$socket = socket;

app.mount("#app");
