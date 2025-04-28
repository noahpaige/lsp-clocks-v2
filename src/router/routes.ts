import HomePage from "@/components/Pages/HomePage/HomePage.vue";
import ClocksDemoPage from "@/components/Pages/Displays/ClocksDemoPage.vue";
import AllClocks from "@/components/Pages/Displays/AllClocks.vue";
import TimezoneClock from "@/components/Pages/Displays/TimezoneClock.vue";
import LoginPage from "@/components/Pages/LoginPage/LoginPage.vue";
import RegisterPage from "@/components/Pages/RegisterPage/RegisterPage.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
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
  {
    path: "/displays/clocks-demo",
    name: "Clocks Demo",
    component: ClocksDemoPage,
  },
  {
    path: "/displays/all-clocks-new",
    name: "All Clocks",
    component: AllClocks,
  },
  {
    path: "/displays/timezone-clocks-new",
    name: "Timezone Clocks",
    component: TimezoneClock,
  },

  // Add more routes as needed
];

export default routes;
