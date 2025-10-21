// Only eager load the absolute critical path
import HomePage from "@/components/Pages/HomePage/HomePage.vue";
import { Settings, Clock, Palette, Bell } from "lucide-vue-next";
import type { Component } from "vue";

// Define route meta interface for type safety
export interface RouteMeta {
  showTopNav?: boolean;
  title?: string;
  category?: string;
  description?: string;
  icon?: Component;
  keywords?: string[];
  showInSidebar?: boolean;
}

// Category labels for organizing sidebar
export const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  displays: "Displays",
  appearance: "Appearance",
  notifications: "Notifications",
};

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
        component: () =>
          import("@/components/Pages/ConfigPage/views/general/application-settings/ApplicationSettingsPage.vue"),
        meta: {
          showTopNav: true,
          title: "Application Settings",
          category: "general",
          description: "Configure general application preferences and settings",
          icon: Settings,
          keywords: ["app", "title", "general", "redis", "settings"],
          showInSidebar: true,
        },
      },
      {
        path: "clock-displays",
        name: "config-clock-displays",
        component: () => import("@/components/Pages/ConfigPage/views/displays/clock-displays/ClockDisplaysPage.vue"),
        meta: {
          showTopNav: true,
          title: "Clock Displays",
          category: "displays",
          description: "Manage clock display layouts",
          icon: Clock,
          keywords: ["display", "clock", "config", "layout", "configurations"],
          showInSidebar: true,
        },
      },
      {
        path: "clock-displays/create",
        name: "config-clock-displays-create",
        component: () =>
          import("@/components/Pages/ConfigPage/views/displays/clock-displays/ClockDisplaysEditorPage.vue"),
        meta: {
          showTopNav: true,
          title: "Create Display Config",
          category: "displays",
          description: "Create a new clock display layout configuration",
          showInSidebar: false, // Don't show in sidebar (accessed via button from clock-displays)
        },
      },
      {
        path: "clock-displays/:id/edit",
        name: "config-clock-displays-edit",
        component: () =>
          import("@/components/Pages/ConfigPage/views/displays/clock-displays/ClockDisplaysEditorPage.vue"),
        meta: {
          showTopNav: true,
          title: "Edit Display Config",
          category: "displays",
          description: "Modify an existing clock display layout",
          showInSidebar: false, // Don't show in sidebar (accessed via button from clock-displays)
        },
      },
      {
        path: "theme",
        name: "config-theme",
        component: () => import("@/components/Pages/ConfigPage/views/appearance/theme/ThemePage.vue"),
        meta: {
          showTopNav: true,
          title: "Theme",
          category: "appearance",
          description: "Customize theme colors and appearance",
          icon: Palette,
          keywords: ["theme", "dark", "light", "colors", "appearance"],
          showInSidebar: true,
        },
      },
      {
        path: "notifications",
        name: "notifications",
        component: () =>
          import("@/components/Pages/ConfigPage/views/notifications/notifications/NotificationSettingsPage.vue"),
        meta: {
          showTopNav: true,
          title: "Notification Settings",
          category: "notifications",
          description: "Configure notification preferences and alerts",
          icon: Bell,
          keywords: ["notifications", "toast", "alerts", "messages"],
          showInSidebar: true,
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
