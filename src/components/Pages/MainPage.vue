<script setup lang="ts">
import Clock from "@/components/Clock/Clock.vue";
import { data } from "../../lib/clockdata";
import { ref } from "vue";
import { useIntervalFn } from "@vueuse/core";

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
  <div class="w-screen h-screen flex p-5 justify-center items-center">
    <div class="w-screen h-fit flex flex-row flex-wrap gap-8 justify-center items-center">
      <div class="w-fit h-fit">
        <Clock labelRight="UTC" :time="clockData.utc" size="2xl" />
      </div>
      <div class="w-fit h-fit">
        <Clock :labelRight="clockData.timezoneStr" :time="clockData.local" size="2xl" />
      </div>
      <div class="w-fit h-fit">
        <Clock :labelLeft="clockData.t > 0 ? 'T+' : 'T-'" :time="clockData.t" timeType="timespan" size="xl" />
      </div>
      <div class="w-fit h-fit">
        <Clock :labelLeft="clockData.l > 0 ? 'L+' : 'L-'" :time="clockData.l" timeType="timespan" size="xl" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.tZero" labelTop="T-Zero" labelRight="UTC" timeType="date" format="DDHHMMSS" size="xl" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.holdRemaining" labelTop="Hold Remaining" timeType="timespan" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.untilRestart" labelTop="Time Until Restart" timeType="timespan" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.windowRemaining" labelTop="Window Remaining" timeType="timespan" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.windowUsed" labelTop="Window Used" timeType="timespan" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" format="MMSS" size="lg" />
      </div>
      <div class="w-fit h-fit">
        <Clock :time="clockData.met" labelLeft="MET" timeType="timespan" format="SS" size="lg" />
      </div>
    </div>
  </div>
</template>
