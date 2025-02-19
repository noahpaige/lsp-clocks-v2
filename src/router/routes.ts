import HomePage from "@/components/Pages/HomePage.vue";
import ClocksDemoPage from "@/components/Pages/ClocksDemoPage.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomePage,
  },
  {
    path: "/clocks-demo",
    name: "Clocks Demo",
    component: ClocksDemoPage,
  },

  // Add more routes as needed
];

export default routes;
