<script setup>
import { ref } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import TopNav from "../HomePage/TopNav.vue";

// Configuration settings
const serverUrl = ref("http://localhost:3000");
const refreshRate = ref("5");
const enableNotifications = ref(true);
const maxWindows = ref("10");

const saveConfig = () => {
  console.log("Configuration saved:", {
    serverUrl: serverUrl.value,
    refreshRate: refreshRate.value,
    enableNotifications: enableNotifications.value,
    maxWindows: maxWindows.value,
  });
  // Add your save logic here
};
</script>

<template>
  <div class="">
    <TopNav />

    <div class="flex flex-col p-6 w-full gap-6 max-w-4xl mx-auto">
      <div>
        <h1 class="text-3xl font-bold">Configuration</h1>
        <p class="text-muted-foreground mt-2">Manage your application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general application preferences</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label for="server-url">Server URL</Label>
            <Input id="server-url" v-model="serverUrl" placeholder="http://localhost:3000" />
          </div>

          <div class="space-y-2">
            <Label for="refresh-rate">Refresh Rate (seconds)</Label>
            <Input id="refresh-rate" v-model="refreshRate" type="number" placeholder="5" />
          </div>

          <div class="space-y-2">
            <Label for="max-windows">Max Windows</Label>
            <Input id="max-windows" v-model="maxWindows" type="number" placeholder="10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Configure display and window preferences</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center space-x-2">
            <input id="notifications" type="checkbox" v-model="enableNotifications" class="h-4 w-4" />
            <Label for="notifications">Enable Notifications</Label>
          </div>
        </CardContent>
      </Card>

      <div class="flex gap-2">
        <Button @click="saveConfig">Save Changes</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  </div>
</template>
