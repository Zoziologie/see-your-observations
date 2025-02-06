import { createApp } from "vue";
import App from "./App.vue";

// Import our custom CSS
import "./style.scss";

// Create and mount the Vue app
const app = createApp(App);
app.mount("#app");
