<script setup lang="ts">
import { computed } from "vue";
import { Input } from "@/components/ui/input";
import { isValidVariant } from "@/shared/variantUtils";

const props = defineProps<{
  modelValue: string;
  existingVariants?: string[];
  mode?: "create" | "update"; // "create" disallows existing names, "update" allows them
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isValid = computed(() => {
  if (!props.modelValue) return true; // Empty is ok

  // Check format validity
  if (!isValidVariant(props.modelValue)) return false;

  // If in "create" mode and checking against existing variants
  if (props.mode === "create" && props.existingVariants) {
    // Variant name already exists - not allowed in create mode
    if (props.existingVariants.includes(props.modelValue)) {
      return false;
    }
  }

  return true;
});

const errorMessage = computed(() => {
  if (!props.modelValue || isValid.value) return null;

  // Check if it's a format error or duplicate error
  if (!isValidVariant(props.modelValue)) {
    return "Use only letters, numbers, hyphens, or underscores";
  }

  if (props.mode === "create" && props.existingVariants?.includes(props.modelValue)) {
    return `Variant "${props.modelValue}" already exists. Select it from the dropdown to update.`;
  }

  return null;
});

const hasError = computed(() => {
  return props.modelValue && !isValid.value;
});

defineExpose({
  isValid,
});
</script>

<template>
  <div class="space-y-1">
    <Input
      :model-value="modelValue"
      @update:model-value="(val) => emit('update:modelValue', String(val))"
      :class="{ 'border-red-500 focus-visible:ring-red-500': hasError }"
      placeholder="Enter variant name (e.g., default, production)"
    />
    <p v-if="errorMessage" class="text-sm text-red-500">
      {{ errorMessage }}
    </p>
  </div>
</template>
