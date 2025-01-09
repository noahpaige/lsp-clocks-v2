import ClocksDemoPage from "@/components/Pages/ClocksDemoPage.vue";
import HomePage from "@/components/Pages/HomePage.vue";
import OpconPage from "@/components/Pages/OpconPage.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/opcon",
    name: "Opcon",
    component: OpconPage,
  },
  {
    path: "/clocks-demo",
    name: "Clocks Demo",
    component: ClocksDemoPage,
  },

  // Add more routes as needed
];

export default routes;
