import { createApp } from "vue";
import "./assets/index.css";
import App from "./App.vue";
import { createClient } from "redis";

const port = 6879;
const client = createClient({
  url: `redis://localhost:${port}`,
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

// TODO
// start up redis client and listen to clock events

createApp(App).mount("#app");
