<script lang="ts" setup>
import type { AcqCardTone } from '../_shared/mock-data';

defineOptions({ name: 'ActionCard' });

withDefaults(
  defineProps<{
    desc: string;
    iconId: string;
    layout?: 'stack' | 'zone';
    title: string;
    tone: AcqCardTone;
  }>(),
  { layout: 'stack' },
);

const toneClass: Record<
  AcqCardTone,
  { accent: string; bg: string; hover: string }
> = {
  blue: {
    accent: 'bg-[#4F7BFF]',
    bg: 'bg-[linear-gradient(155deg,#fff_50%,#F0F5FF)]',
    hover: 'hover:border-[#4F7BFF]',
  },
  cyan: {
    accent: 'bg-[#13BEE5]',
    bg: 'bg-[linear-gradient(155deg,#fff_50%,#ECFAFE)]',
    hover: 'hover:border-[#13BEE5]',
  },
  green: {
    accent: 'bg-[#24BFA0]',
    bg: 'bg-[linear-gradient(155deg,#fff_50%,#EDFBF8)]',
    hover: 'hover:border-[#24BFA0]',
  },
  orange: {
    accent: 'bg-[#FF8A4C]',
    bg: 'bg-[linear-gradient(155deg,#fff_50%,#FFF5EF)]',
    hover: 'hover:border-[#FF8A4C]',
  },
  purple: {
    accent: 'bg-[#965DFF]',
    bg: 'bg-[linear-gradient(155deg,#fff_50%,#F7F2FF)]',
    hover: 'hover:border-[#965DFF]',
  },
};
</script>

<template>
  <button
    class="relative overflow-hidden rounded-[14px] border border-[#DDE1EC] text-left shadow-[0_5px_18px_rgba(25,37,72,.055)] transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_32px_rgba(40,52,100,.14)]"
    :class="[
      toneClass[tone].bg,
      toneClass[tone].hover,
      layout === 'zone'
        ? 'flex min-h-[116px] items-center gap-2.5 p-3.5'
        : 'flex min-h-[166px] flex-col p-3',
    ]"
    type="button"
  >
    <span
      class="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] opacity-75"
      :class="toneClass[tone].accent"
    ></span>
    <div
      v-if="layout === 'zone'"
      class="h-[66px] w-[66px] shrink-0 overflow-visible p-0"
    >
      <svg
        aria-hidden="true"
        class="block h-full w-full overflow-visible"
        viewBox="0 0 64 64"
      >
        <use :href="`#${iconId}`" />
      </svg>
    </div>
    <div :class="layout === 'zone' ? 'min-w-0 flex-1' : ''">
      <div
        class="font-semibold text-[#0A0A0A]"
        :class="
          layout === 'zone'
            ? 'mb-[3px] text-[12.5px] sm:text-[13px]'
            : 'mb-[2px] text-[12px] sm:text-[12.5px]'
        "
      >
        {{ title }}
      </div>
      <div
        class="text-[#6B7280]"
        :class="
          layout === 'zone'
            ? 'text-[11px] leading-relaxed sm:text-[11.5px]'
            : 'text-[10.5px] leading-snug sm:text-[11px]'
        "
      >
        {{ desc }}
      </div>
    </div>
    <div
      v-if="layout !== 'zone'"
      class="ml-auto mt-auto h-[55px] w-[55px] shrink-0 overflow-visible p-0"
    >
      <svg
        aria-hidden="true"
        class="block h-full w-full overflow-visible"
        viewBox="0 0 64 64"
      >
        <use :href="`#${iconId}`" />
      </svg>
    </div>
  </button>
</template>
