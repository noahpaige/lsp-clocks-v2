<script setup lang="ts">
import ClockT from "@/components/Clocks/ClockT.vue";
import ClockUTC from "@/components/Clocks/ClockUTC.vue";
import ClockLocal from "../Clocks/ClockLocal.vue";
import ClockHoldRemaining from "@/components/Clocks/ClockHoldRemaining.vue";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

const date = new Date();
const times = ref([date.getTime() + date.getTimezoneOffset() * 60 * 1000, Date.now(), 1234567890]);

const timezoneStr = ref(new Date().toLocaleString("en-US", { timeZoneName: "short" }).split(" ")[3]);

useIntervalFn(() => {
  times.value[0] += 1000;
  times.value[1] += 1000;
  times.value[2] -= 1000;
}, 1000);
</script>

<template>
  <div class="w-screen h-screen flex flex-row flex-wrap gap-5 p-5 justify-center items-center">
    <div class="w-fit h-fit">
      <ClockUTC :time="times[0]" size="xl" />
    </div>
    <div class="w-fit h-fit">
      <ClockLocal :labelRight="timezoneStr" :time="times[1]" size="xl" />
    </div>
    <div class="w-fit h-fit">
      <ClockT :time="times[2]" size="xl" />
    </div>
    <div class="w-fit h-fit">
      <ClockHoldRemaining :time="202222222" size="lg" />
    </div>
    <div class="w-fit h-fit">
      <ClockHoldRemaining :time="202222222" size="lg" />
    </div>
  </div>
</template>

ttime ltime tuime until restart window remaining window used shed hold remaining ====plus ==== utc met (HHMMSS) met
(MMSS) met (SS) Tzero (DDHHMMSS)
