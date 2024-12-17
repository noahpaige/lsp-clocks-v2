<script setup lang="ts">
import Clock from "@/components/Clocks/Clock/Clock.vue";
import ClockT from "@/components/Clocks/ClockT.vue";
import ClockUTC from "@/components/Clocks/ClockUTC.vue";
import ClockHoldRemaining from "@/components/Clocks/ClockHoldRemaining.vue";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

//TODO TIMESPAN https://github.com/indexzero/TimeSpan.js

const times = ref([
  123456789, 1234567890, 12345678900, 123456789000, 1234567890000,
  12345678900000,
]);

useIntervalFn(() => {
  times.value = times.value.map((time) => (time += 1000));
}, 1000);
</script>

<template>
  <div class="w-screen flex flex-col gap-5 p-5 justify-center items-center">
    <ClockUTC :time="times[0]" size="lg" />
    <ClockT :time="times[0]" size="lg" />
    <ClockHoldRemaining :time="202222222" size="lg" />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="XS Hold Remaining"
      :time="times[0]"
      size="xs"
    />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="SM Hold Remaining"
      :time="times[1]"
      size="sm"
    />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="MD Hold Remaining"
      :time="times[2]"
      size="md"
    />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="LG Hold Remaining"
      :time="times[3]"
      size="lg"
    />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="XL Hold Remaining"
      :time="times[4]"
      size="xl"
    />
    <Clock
      labelLeft="left"
      labelRight="right"
      labelTop="2XL Hold Remaining"
      :time="times[5]"
      size="2xl"
    />
  </div>
</template>
