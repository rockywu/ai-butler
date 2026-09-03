<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { cardClass } from '../../_shared/chic-classes';

const stats = [
  { delta: '', label: '运行中任务', value: '1' },
  {
    delta: '某音 86 · 小某书 31 · 某手 11',
    label: '今日新增线索',
    value: '128',
  },
  { delta: '', label: '累计私信触达', value: '3,420' },
  { delta: '某音 3 · 小某书 1 · 某手 1', label: '绑定账号', value: '5' },
];

const trend = [
  { height: '44%', label: '08-24', today: false, value: 76 },
  { height: '58%', label: '08-25', today: false, value: 98 },
  { height: '40%', label: '08-26', today: false, value: 64 },
  { height: '70%', label: '08-27', today: false, value: 112 },
  { height: '52%', label: '08-28', today: false, value: 86 },
  { height: '62%', label: '08-29', today: false, value: 104 },
  { height: '80%', label: '今天', today: true, value: 128 },
];

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] md:w-[640px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: '数据总览',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <div class="mb-3.5 grid grid-cols-2 gap-2.5">
      <div
        v-for="stat in stats"
        :key="stat.label"
        :class="cardClass"
        class="px-3 py-2.5"
      >
        <div class="text-[11px] text-[#6B7280]">{{ stat.label }}</div>
        <div class="text-[22px] font-semibold text-[#0A0A0A]">
          {{ stat.value }}
        </div>
        <div v-if="stat.delta" class="text-[11px] text-[#6B7280]">
          {{ stat.delta }}
        </div>
      </div>
    </div>
    <div :class="cardClass" class="p-3">
      <h3 class="mb-3 text-[13px] font-semibold text-[#0A0A0A]">
        近 7 日新增线索趋势
      </h3>
      <div class="flex h-[110px] items-end gap-2.5 px-1">
        <div
          v-for="bar in trend"
          :key="bar.label"
          class="flex flex-1 flex-col items-center gap-1.5"
        >
          <div
            class="w-full rounded-t-[6px]"
            :class="
              bar.today
                ? 'bg-[linear-gradient(180deg,#4B3FE3,#7C3AED)]'
                : 'bg-[linear-gradient(180deg,#A78BFA,#C4B5FD)]'
            "
            :style="{ height: bar.height }"
          ></div>
          <span class="text-center text-[10px] leading-tight text-[#6B7280]">
            {{ bar.label }}<br />{{ bar.value }}
          </span>
        </div>
      </div>
    </div>
  </Modal>
</template>
