<script setup>
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWindowManager } from "@/composables/WindowManager/useWindowManager";
import { useRouter } from "vue-router";

const router = useRouter();
const { openWindow, closeWindow } = useWindowManager();

// Display windows data
const displays = ref([
  { id: 1, name: "All Clocks", route: "/displays/all-clocks-new", status: "closed", position: "Monitor 1" },
  { id: 2, name: "Timezone Clocks", route: "/displays/timezone-clocks-new", status: "closed", position: "Monitor 2" },
  { id: 3, name: "Clocks Demo", route: "/displays/clocks-demo", status: "closed", position: "Monitor 1" },
]);

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
  item.status = "closed";
};

const closeAllDisplays = () => {
  displays.value.forEach((item) => {
    if (item.status === "open") {
      closeDisplay(item);
    }
  });
};

const launchAllDisplays = () => {
  displays.value.forEach((item) => {
    if (item.status === "closed") {
      launchDisplay(item);
    }
  });
};
</script>

<template>
  <div class="">
    <div class="flex flex-col p-6 w-full gap-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">Display Controller</h1>
          <p class="text-muted-foreground mt-2">Manage and control all display windows</p>
        </div>
        <div class="flex gap-2">
          <Button @click="launchAllDisplays" variant="default">Launch All</Button>
          <Button @click="closeAllDisplays" variant="destructive">Close All</Button>
        </div>
      </div>

      <Card>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="item in displays" :key="item.id">
                <TableCell class="font-medium">{{ item.name }}</TableCell>
                <TableCell>{{ item.position }}</TableCell>
                <TableCell>
                  <Badge
                    class="transition-all duration-300"
                    :variant="item.status === 'open' ? 'default' : 'destructive'"
                  >
                    {{ item.status }}
                  </Badge>
                </TableCell>
                <TableCell class="flex gap-2">
                  <Button
                    class="w-20 transition-all duration-300"
                    :variant="item.status === 'closed' ? 'default' : 'secondary'"
                    @click="launchDisplay(item)"
                  >
                    {{ item.status === "closed" ? "Launch" : "Focus" }}
                  </Button>
                  <Button
                    class="transition-all duration-300"
                    variant="destructive"
                    :disabled="item.status === 'closed'"
                    @click="closeDisplay(item)"
                  >
                    Close
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
