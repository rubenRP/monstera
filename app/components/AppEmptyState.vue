<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  /** 'pot' for "nothing here yet", 'done' for "all caught up" */
  illustration?: 'pot' | 'done'
}>(), {
  description: undefined,
  illustration: 'pot'
})
</script>

<template>
  <div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default px-6 py-8 text-center">
    <svg
      viewBox="0 0 96 96"
      class="size-20 text-primary"
      aria-hidden="true"
    >
      <circle
        cx="48"
        cy="48"
        r="44"
        class="fill-current opacity-10"
      />
      <template v-if="illustration === 'pot'">
        <path
          d="M48 58c0-14 6-22 18-26-2 12-8 20-18 26Z"
          class="fill-current opacity-70"
        />
        <path
          d="M48 58c0-10-5-17-15-20 1 10 6 16 15 20Z"
          class="fill-current opacity-45"
        />
        <path
          d="M48 58V44"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
        />
        <path
          d="M32 58h32l-4 18a4 4 0 0 1-4 3H40a4 4 0 0 1-4-3l-4-18Z"
          class="fill-current opacity-90"
        />
      </template>
      <template v-else>
        <path
          d="M48 22c12 8 18 18 18 28a18 18 0 0 1-36 0c0-10 6-20 18-28Z"
          class="fill-current opacity-30"
        />
        <path
          d="m38 50 7 7 13-14"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </template>
    </svg>
    <div class="space-y-1">
      <p class="font-semibold text-highlighted">
        {{ title }}
      </p>
      <p
        v-if="description"
        class="text-sm text-muted"
      >
        {{ description }}
      </p>
    </div>
    <slot />
  </div>
</template>
