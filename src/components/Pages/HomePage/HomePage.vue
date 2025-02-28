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
import Badge from "@/components/ui/badge/Badge.vue";

const router = useRouter();
const { openWindow, closeWindow } = useWindowManager();

// Table data
const tableData = ref([
  { name: "All Clocks", route: "/displays/all-clocks-new", status: "closed" },
  { name: "Timezone Clocks", route: "/displays/timezone-clocks-new", status: "closed" },
  { name: "Clock GHI", route: "/displays/clocks-demo", status: "closed" },
  { name: "Clock JKL", route: "/displays/clocks-demo", status: "closed" },
  { name: "Clock MNO", route: "/displays/clocks-demo", status: "closed" },
  { name: "Clock PQR", route: "/displays/clocks-demo", status: "closed" },
  { name: "Clock STU", route: "/displays/clocks-demo", status: "closed" },
]);

// Search functionality (basic example)
const searchQuery = ref("");
const filteredData = computed(() => {
  return tableData.value.filter((row) => row.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const launchDisplay = (item) => {
  const url = router.resolve(item.route).href;
  openWindow(url, () => {
    item.status = "closed";
  });
  item.status = "open";
};

const closeDisplay = (item) => {
  const url = router.resolve(item.route).href;
  closeWindow(url);
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
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in filteredData" :key="item.id">
              <TableCell>{{ item.name }}</TableCell>
              <TableCell
                ><Badge :variant="item.status === 'open' ? 'default' : 'destructive'">{{ item.status }}</Badge>
              </TableCell>
              <TableCell class="flex gap-2">
                <Button class="w-20" @click="launchDisplay(item)">
                  {{ item.status === "closed" ? "Launch" : "Focus" }}
                </Button>
                <Button variant="destructive" :disabled="item.status === 'closed'" @click="closeDisplay(item)">
                  Close
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  </div>
</template>
