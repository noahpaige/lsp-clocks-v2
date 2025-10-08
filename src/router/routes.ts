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
    component: ConfigPage,
    meta: { showTopNav: false },
    children: [
      {
        path: "",
        redirect: "/config/application-settings",
      },
      {
        path: "application-settings",
        name: "config-application-settings",
        component: () => import("@/components/Pages/ConfigPage/views/general/ApplicationSettings.vue"),
        meta: { showTopNav: true, title: "Application Settings", category: "general" },
      },
      {
        path: "display-configs",
        name: "config-display-configs",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigsList.vue"),
        meta: { showTopNav: true, title: "Display Configurations", category: "displays" },
      },
      {
        path: "display-configs/create",
        name: "config-display-config-create",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue"),
        meta: { showTopNav: true, title: "Create Display Config", category: "displays" },
      },
      {
        path: "display-configs/:id/edit",
        name: "config-display-config-edit",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue"),
        meta: { showTopNav: true, title: "Edit Display Config", category: "displays" },
      },
      {
        path: "theme",
        name: "config-theme",
        component: () => import("@/components/Pages/ConfigPage/views/appearance/ThemeSettings.vue"),
        meta: { showTopNav: true, title: "Theme Settings", category: "appearance" },
      },
      {
        path: "notifications",
        name: "config-notifications",
        component: () => import("@/components/Pages/ConfigPage/views/notifications/NotificationSettings.vue"),
        meta: { showTopNav: true, title: "Notification Settings", category: "notifications" },
      },
    ],
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
