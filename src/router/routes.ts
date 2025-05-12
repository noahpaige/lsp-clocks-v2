import LoginPage from "@/components/Pages/LoginPage/LoginPage.vue";
import RegisterPage from "@/components/Pages/RegisterPage/RegisterPage.vue";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterPage,
  },

  // Add more routes as needed
];

export default routes;
