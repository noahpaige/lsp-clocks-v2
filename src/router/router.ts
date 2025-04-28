import { createRouter, createWebHistory } from "vue-router";
import routes from "./routes.js";

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global navigation guard
// TODO: replace this later with more robust authentication
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (!isAuthenticated && to.path !== "/register" && to.path !== "/login") {
    // Redirect unauthenticated users to the login page
    next({ path: "/login" });
  } else {
    // Allow navigation
    next();
  }
});

export default router;
