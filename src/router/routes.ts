import HomePage from "@/components/Pages/HomePage/HomePage.vue";
import ClocksDemoPage from "@/components/Pages/Displays/ClocksDemoPage.vue";
import AllClocks from "@/components/Pages/Displays/AllClocks.vue";
import TimezoneClock from "@/components/Pages/Displays/TimezoneClock.vue";
import LoginPage from "@/components/Pages/LoginPage/LoginPage.vue";
import RegisterPage from "@/components/Pages/RegisterPage/RegisterPage.vue";
import ConfigPage from "@/components/Pages/ConfigPage/ConfigPage.vue";
import DisplayControllerPage from "@/components/Pages/DisplayControllerPage/DisplayControllerPage.vue";

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
  {
    path: "/config",
    name: "Config",
    component: ConfigPage,
  },
  {
    path: "/display-controller",
    name: "Display Controller",
    component: DisplayControllerPage,
  },

  // Add more routes as needed
];

export default routes;
