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
    meta: { showTopNav: true },
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { showTopNav: false },
  },
  {
    path: "/register",
    name: "Register",
    component: RegisterPage,
    meta: { showTopNav: false },
  },
  {
    path: "/displays/clocks-demo",
    name: "Clocks Demo",
    component: ClocksDemoPage,
    meta: { showTopNav: false },
  },
  {
    path: "/displays/all-clocks-new",
    name: "All Clocks",
    component: AllClocks,
    meta: { showTopNav: false },
  },
  {
    path: "/displays/timezone-clocks-new",
    name: "Timezone Clocks",
    component: TimezoneClock,
    meta: { showTopNav: false },
  },
  {
    path: "/config",
    name: "Config",
    component: ConfigPage,
    meta: { showTopNav: true },
  },
  {
    path: "/display-controller",
    name: "Display Controller",
    component: DisplayControllerPage,
    meta: { showTopNav: true },
  },

  // Add more routes as needed
];

export default routes;
