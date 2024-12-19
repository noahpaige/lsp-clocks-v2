<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import { data } from "../../lib/clockdata";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

//TODO TIMESPAN https://github.com/indexzero/TimeSpan.js

const clockData = ref(data);

useIntervalFn(() => {
  clockData.value.utc += 1000;
  clockData.value.local += 1000;
  clockData.value.t += 1000;
  clockData.value.l += 1000;
  clockData.value.met += 1000;
}, 1000);
</script>

<template>
  <div class="w-screen h-screen flex flex-col gap-5 p-5 justify-center items-center">
    <Carousel class="relative w-full h-full" :opts="{ loop: true }">
      <CarouselContent>
        <CarouselItem>
          <Clock labelRight="UTC" :time="clockData.utc" size="2xl" />
        </CarouselItem>
        <CarouselItem>
          <Clock :labelLeft="clockData.t > 0 ? 'T+' : 'T-'" :time="clockData.t" timeType="timespan" size="xl" />
        </CarouselItem>
        <CarouselItem>
          <Clock :time="clockData.holdRemaining" labelTop="Hold Remaining" timeType="timespan" size="lg" />
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
</template>
