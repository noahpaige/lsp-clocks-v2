<script setup>
import { ref, computed } from "vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Clock } from "lucide-vue-next";
import { useToaster } from "@/composables/useToaster";

const { emitToast } = useToaster();

const onClickSettings = () => {
  emitToast({
    title: "Settings Clicked!",
    type: "info",
    deliverTo: "all",
  });
};
</script>

<template>
  <div class="flex items-center justify-between border-b p-2">
    <div class="flex items-center">
      <Clock class="bg-primary text-black rounded-full w-5 h-5" />
      <div class="text-lg font-bold ml-2">LSP Clocks</div>
    </div>
    <Button variant="outline" @click="onClickSettings" q><Settings /> </Button>
  </div>
</template>
