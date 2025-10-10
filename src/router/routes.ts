const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/components/Pages/HomePage/HomePage.vue"),
    meta: { showTopNav: true },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/components/Pages/LoginPage/LoginPage.vue"),
    meta: { showTopNav: false },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/components/Pages/RegisterPage/RegisterPage.vue"),
    meta: { showTopNav: false },
  },
  {
    path: "/displays/clocks-demo",
    name: "Clocks Demo",
    component: () => import("@/components/Pages/Displays/ClocksDemoPage.vue"),
    meta: { showTopNav: false },
  },
  {
    path: "/displays/all-clocks-new",
    name: "All Clocks",
    component: () => import("@/components/Pages/Displays/AllClocks.vue"),
    meta: { showTopNav: false },
  },
  {
    path: "/displays/timezone-clocks-new",
    name: "Timezone Clocks",
    component: () => import("@/components/Pages/Displays/TimezoneClock.vue"),
    meta: { showTopNav: false },
  },
  {
    path: "/config",
    component: () => import("@/components/Pages/ConfigPage/ConfigPage.vue"),
    meta: { showTopNav: true },
    children: [
      {
        path: "",
        redirect: "/config/application-settings",
      },
      {
        path: "application-settings",
        name: "config-application-settings",
        component: () => import("@/components/Pages/ConfigPage/views/general/ApplicationSettings.vue"),
        meta: {
          showTopNav: true,
          title: "Application Settings",
          category: "general",
          description: "Configure general application preferences and settings",
        },
      },
      {
        path: "display-configs",
        name: "config-display-configs",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigsList.vue"),
        meta: {
          showTopNav: true,
          title: "Display Configurations",
          category: "displays",
          description: "Manage clock display layouts",
        },
      },
      {
        path: "display-configs/create",
        name: "config-display-config-create",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue"),
        meta: {
          showTopNav: true,
          title: "Create Display Config",
          category: "displays",
          description: "Create a new clock display layout configuration",
        },
      },
      {
        path: "display-configs/:id/edit",
        name: "config-display-config-edit",
        component: () => import("@/components/Pages/ConfigPage/views/displays/DisplayConfigEditor.vue"),
        meta: {
          showTopNav: true,
          title: "Edit Display Config",
          category: "displays",
          description: "Modify an existing clock display layout",
        },
      },
      {
        path: "theme",
        name: "config-theme",
        component: () => import("@/components/Pages/ConfigPage/views/appearance/ThemeSettings.vue"),
        meta: {
          showTopNav: true,
          title: "Theme Settings",
          category: "appearance",
          description: "Customize theme colors and appearance",
        },
      },
      {
        path: "notifications",
        name: "config-notifications",
        component: () => import("@/components/Pages/ConfigPage/views/notifications/NotificationSettings.vue"),
        meta: {
          showTopNav: true,
          title: "Notification Settings",
          category: "notifications",
          description: "Configure notification preferences and alerts",
        },
      },
    ],
  },
  {
    path: "/display-controller",
    name: "Display Controller",
    component: () => import("@/components/Pages/DisplayControllerPage/DisplayControllerPage.vue"),
    meta: { showTopNav: true },
  },

  // Add more routes as needed
];

export default routes;
