<script setup>
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Clock } from "lucide-vue-next";
import { useRouter } from "vue-router";

import { useWindowManager } from "@/composables/useWindowManager";
import TopNav from "./TopNav.vue";

const router = useRouter();
const { openWindow } = useWindowManager();

// Table data
const tableData = ref([
  { name: "All Clocks", route: "/displays/all-clocks-new" },
  { name: "Timezone Clocks", route: "/displays/timezone-clocks-new" },
  { name: "Clock GHI", route: "/displays/clocks-demo" },
  { name: "Clock JKL", route: "/displays/clocks-demo" },
  { name: "Clock MNO", route: "/displays/clocks-demo" },
  { name: "Clock PQR", route: "/displays/clocks-demo" },
  { name: "Clock STU", route: "/displays/clocks-demo" },
]);

// Search functionality (basic example)
const searchQuery = ref("");
const filteredData = computed(() => {
  return tableData.value.filter((row) => row.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const launchClockWindow = (route) => {
  const url = router.resolve(route).href;
  openWindow(url);
};
</script>

<template>
  <div class="">
    <TopNav />

    <div class="flex flex-col p-3 w-full gap-2">
      <Input v-model="searchQuery" placeholder="Search..." class="w-40" />

      <Card class="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredData" :key="item.id">
              <TableCell>{{ item.name }}</TableCell>
              <TableCell>
                <Button @click="launchClockWindow(item.route)">Launch</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
</template>
