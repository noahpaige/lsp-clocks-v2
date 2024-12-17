<script setup lang="ts">
import ClockT from "@/components/Clocks/ClockT.vue";
import ClockUTC from "@/components/Clocks/ClockUTC.vue";
import ClockHoldRemaining from "@/components/Clocks/ClockHoldRemaining.vue";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  <div
    class="w-screen h-screen flex flex-col gap-5 p-5 justify-center items-center"
  >
    <Carousel class="relative w-full h-full" :opts="{ loop: true }">
      <CarouselContent>
        <CarouselItem>
          <ClockUTC :time="times[0]" size="lg" />
        </CarouselItem>
        <CarouselItem>
          <ClockT :time="times[0]" size="lg" />
        </CarouselItem>
        <CarouselItem>
          <ClockHoldRemaining :time="202222222" size="lg" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
</template>
