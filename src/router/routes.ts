import HomePage from "@/components/Pages/HomePage.vue";
import ClocksDemoPage from "@/components/Pages/Clocks/New/ClocksDemoPage.vue";
import AllClocks from "@/components/Pages/Clocks/New/AllClocks.vue";
import TimezoneClock from "@/components/Pages/Clocks/New/TimezoneClock.vue";

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
  {
    path: "/all-clocks-new",
    name: "All Clocks",
    component: AllClocks,
  },
  {
    path: "/timezone-clocks-new",
    name: "Timezone Clocks",
    component: TimezoneClock,
  },

  // Add more routes as needed
];

export default routes;
