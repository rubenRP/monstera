<script setup lang="ts">
export interface GrowthPoint {
  at: string
  value: number
}

const props = defineProps<{
  points: GrowthPoint[]
  unit: string
}>()

const { t } = useI18n()
const { dateLocale } = useDateLocale()

const W = 320
const H = 150
const PAD = { top: 18, right: 40, bottom: 24, left: 8 }

const sorted = computed(() => [...props.points].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()))

const scale = computed(() => {
  const times = sorted.value.map(p => new Date(p.at).getTime())
  const values = sorted.value.map(p => p.value)
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  // Pad the value range so the line never touches the frame
  const vMinRaw = Math.min(...values)
  const vMaxRaw = Math.max(...values)
  const pad = Math.max(1, (vMaxRaw - vMinRaw) * 0.15)
  const vMin = Math.max(0, vMinRaw - pad)
  const vMax = vMaxRaw + pad
  const x = (time: number) => PAD.left + (tMax === tMin ? 0.5 : (time - tMin) / (tMax - tMin)) * (W - PAD.left - PAD.right)
  const y = (value: number) => PAD.top + (1 - (value - vMin) / (vMax - vMin)) * (H - PAD.top - PAD.bottom)
  return { x, y, vMin, vMax }
})

const coords = computed(() =>
  sorted.value.map(p => ({
    ...p,
    cx: scale.value.x(new Date(p.at).getTime()),
    cy: scale.value.y(p.value)
  }))
)

const path = computed(() => coords.value.map((c, i) => `${i ? 'L' : 'M'}${c.cx.toFixed(1)},${c.cy.toFixed(1)}`).join(' '))

const gridValues = computed(() => {
  const values = sorted.value.map(p => p.value)
  return [...new Set([Math.min(...values), Math.max(...values)])]
})

function formatDate(iso: string, withYear = false) {
  return new Date(iso).toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
}

function formatValue(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} ${props.unit}`
}

const active = ref<number | null>(null)
const activePoint = computed(() => (active.value == null ? null : coords.value[active.value] ?? null))
const last = computed(() => coords.value[coords.value.length - 1] ?? null)
</script>

<template>
  <figure class="relative">
    <svg
      :viewBox="`0 0 ${W} ${H}`"
      class="h-auto w-full overflow-visible"
      role="img"
      :aria-label="t('plants.growthChartAria', { count: points.length })"
      @mouseleave="active = null"
    >
      <!-- Recessive grid: only the min and max observed values -->
      <g>
        <template
          v-for="value in gridValues"
          :key="value"
        >
          <line
            :x1="PAD.left"
            :x2="W - PAD.right"
            :y1="scale.y(value)"
            :y2="scale.y(value)"
            class="stroke-current text-default"
            stroke-opacity="0.35"
            stroke-dasharray="2 4"
            stroke-width="1"
          />
          <text
            :x="W - PAD.right + 6"
            :y="scale.y(value) + 4"
            class="fill-current text-[10px] text-muted tabular-nums"
          >{{ formatValue(value) }}</text>
        </template>
      </g>

      <path
        :d="path"
        fill="none"
        stroke="var(--chart-growth)"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <line
        v-if="activePoint"
        :x1="activePoint.cx"
        :x2="activePoint.cx"
        :y1="PAD.top - 6"
        :y2="H - PAD.bottom"
        class="stroke-current text-muted"
        stroke-width="1"
      />

      <g
        v-for="(c, i) in coords"
        :key="c.at"
      >
        <!-- 8px marker with a 2px surface ring -->
        <circle
          :cx="c.cx"
          :cy="c.cy"
          :r="active === i ? 5 : 4"
          fill="var(--chart-growth)"
          class="stroke-current text-(--ui-bg-elevated)"
          stroke-width="2"
        />
        <!-- Larger, focusable hit target -->
        <circle
          :cx="c.cx"
          :cy="c.cy"
          r="14"
          fill="transparent"
          tabindex="0"
          class="cursor-pointer focus:outline-none"
          :aria-label="`${formatDate(c.at, true)}: ${formatValue(c.value)}`"
          @mouseenter="active = i"
          @focus="active = i"
          @blur="active = null"
        />
      </g>

      <!-- Selective direct label: latest value only -->
      <text
        v-if="last && active == null && gridValues.length > 1"
        :x="last.cx"
        :y="last.cy - 10"
        text-anchor="middle"
        class="fill-current text-[11px] font-semibold text-highlighted tabular-nums"
      >{{ formatValue(last.value) }}</text>

      <text
        v-if="coords.length"
        :x="PAD.left"
        :y="H - 6"
        class="fill-current text-[10px] text-muted"
      >{{ formatDate(coords[0]!.at, true) }}</text>
      <text
        v-if="coords.length > 1"
        :x="W - PAD.right"
        :y="H - 6"
        text-anchor="end"
        class="fill-current text-[10px] text-muted"
      >{{ formatDate(coords[coords.length - 1]!.at, true) }}</text>
    </svg>

    <div
      v-if="activePoint"
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-default bg-default px-2 py-1 text-xs shadow-md"
      :style="{ left: `${(activePoint.cx / W) * 100}%`, top: `${(activePoint.cy / H) * 100}%`, marginTop: '-10px' }"
    >
      <p class="font-semibold text-highlighted tabular-nums">
        {{ formatValue(activePoint.value) }}
      </p>
      <p class="text-muted">
        {{ formatDate(activePoint.at, true) }}
      </p>
    </div>

    <!-- Table view for screen readers -->
    <table class="sr-only">
      <caption>{{ t('plants.growthTitle') }}</caption>
      <thead>
        <tr>
          <th scope="col">
            {{ t('plants.growthDate') }}
          </th>
          <th scope="col">
            {{ t('plants.heightLabel') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in coords"
          :key="c.at"
        >
          <td>{{ formatDate(c.at, true) }}</td>
          <td>{{ formatValue(c.value) }}</td>
        </tr>
      </tbody>
    </table>
  </figure>
</template>
