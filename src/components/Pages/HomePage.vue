<script setup>
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Clock } from "lucide-vue-next";
import { useRouter } from "vue-router";

const router = useRouter();

// Table data
const tableData = ref([
  { name: "All Clocks", route: "/all-clocks-new" },
  { name: "Timezone Clocks", route: "/timezone-clocks-new" },
  { name: "Clock GHI", route: "/clocks-demo" },
  { name: "Clock JKL", route: "/clocks-demo" },
  { name: "Clock MNO", route: "/clocks-demo" },
  { name: "Clock PQR", route: "/clocks-demo" },
  { name: "Clock STU", route: "/clocks-demo" },
]);

// Search functionality (basic example)
const searchQuery = ref("");
const filteredData = computed(() => {
  return tableData.value.filter((row) => row.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

const launchClockWindow = (route) => {
  const url = router.resolve(route).href;
  window.open(url, "newwindow", "width=800,height=600,noopener,noreferrer");
};
</script>

<template>
  <div class="">
    <!-- Header Section -->
    <div class="flex items-center justify-between border-b p-2">
      <div class="flex items-center">
        <Clock class="bg-primary text-black rounded w-5 h-5" />
        <div class="text-lg font-bold ml-2">LSP Clocks</div>
      </div>
      <Button variant="outline" class="bg-"><Settings /> </Button>
    </div>

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
