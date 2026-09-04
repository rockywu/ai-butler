<script lang="ts" setup>
import { useRouter } from 'vue-router';

import { Card, Tag } from 'ant-design-vue';

import { cardClass, pageGapClass } from '../_shared/chic-classes';
import {
  workbenchDevices,
  workbenchFeeds,
  workbenchStats,
} from '../_shared/mock-data';
import PageShell from '../_shared/page-shell.vue';

const router = useRouter();

function viewAllAcquisition() {
  router.push({ name: 'AiButlerAcquisition' });
}
</script>

<template>
  <PageShell>
    <div :class="pageGapClass">
      <div
        class="relative overflow-hidden rounded-[15px] border border-[#DCDAD4] bg-[linear-gradient(135deg,#F8F8F5_0%,#EEEEEA_100%)] px-5 py-6 sm:px-7 sm:py-8"
      >
        <div
          class="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border-[28px] border-white/60"
        ></div>
        <div class="relative z-[1]">
          <span
            class="mb-2 inline-flex rounded-full border border-[#CAC9C2] bg-white/80 px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] text-[#4B4B47]"
          >
            AS GROWTH OS
          </span>
          <h2
            class="mb-1.5 text-[18px] font-bold tracking-[-0.02em] text-[#0A0A0A] sm:text-[22px]"
          >
            阿斯系统 · 智能增长中枢
          </h2>
          <p class="m-0 text-[11.5px] text-[#666660] sm:text-[12.5px]">
            让获客、内容、客户沟通与设备协同，在一个工作台高效运转
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 class="m-0 text-[14px] font-bold text-[#0A0A0A]">数据总览</h3>
        <span class="text-[11px] text-[#85857F]">今日业务数据实时汇总</span>
      </div>

      <div class="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
        <div
          v-for="item in workbenchStats"
          :key="item.label"
          class="relative overflow-hidden rounded-[15px] border border-[#DCDAD4] bg-white p-3.5 shadow-[0_1px_0_rgba(10,10,10,.04),0_5px_16px_rgba(10,10,10,.035)] sm:p-4"
        >
          <span
            class="absolute inset-x-0 top-0 h-[3px]"
            :class="item.accentClass"
          ></span>
          <div
            class="mb-1 text-[11.5px] text-[#71716B] sm:mb-1.5 sm:text-[12px]"
          >
            {{ item.label }}
          </div>
          <div
            class="text-[20px] font-bold leading-tight text-[#0A0A0A] sm:text-[22px]"
          >
            {{ item.value }}
          </div>
          <div
            class="mt-[3px] text-[10.5px] sm:text-[11px]"
            :class="item.positive ? 'text-[#16803C]' : 'text-[#71716B]'"
          >
            {{ item.delta }}
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3.5">
        <Card :bordered="false" :class="cardClass">
          <template #title>
            <div class="flex items-center justify-between">
              <span
                class="text-[12.5px] font-bold text-[#0A0A0A] sm:text-[13px]"
                >设备连接状态</span>
              <Tag color="success">本机在线</Tag>
            </div>
          </template>
          <ul class="m-0 list-none p-0">
            <li
              v-for="(device, index) in workbenchDevices"
              :key="device.id"
              class="flex flex-wrap items-center gap-2 py-2 text-[11.5px] sm:text-[12px]"
              :class="
                index !== workbenchDevices.length - 1
                  ? 'border-b border-dashed border-[#DCDAD4]'
                  : ''
              "
            >
              <Tag :color="device.tone === 'success' ? 'success' : 'warning'">
                {{ device.status }}
              </Tag>
              <strong class="text-[#0A0A0A]">{{ device.label }}</strong>
              <span
                class="ml-auto text-[10.5px] text-[#71716B] sm:text-[11px]"
                >{{ device.meta }}</span>
            </li>
          </ul>
        </Card>

        <Card :bordered="false" :class="cardClass">
          <template #title>
            <div class="flex items-center justify-between">
              <span
                class="text-[12.5px] font-bold text-[#0A0A0A] sm:text-[13px]"
                >最新动态</span>
              <button
                type="button"
                class="cursor-pointer rounded-[7px] border border-[#CFCFC8] bg-white px-2.5 py-1 text-[11.5px] font-medium text-[#242422] transition-colors hover:bg-[#F2F2EE] sm:text-[12px]"
                @click="viewAllAcquisition"
              >
                查看全部
              </button>
            </div>
          </template>
          <ul class="m-0 list-none p-0">
            <li
              v-for="feed in workbenchFeeds"
              :key="feed.id"
              class="flex items-start gap-2 py-2 text-[11.5px] leading-relaxed sm:text-[12px]"
              :class="
                feed.id !== workbenchFeeds[workbenchFeeds.length - 1]?.id
                  ? 'border-b border-dashed border-[#DCDAD4]'
                  : ''
              "
            >
              <span
                class="mt-1.5 h-[7px] w-[7px] flex-shrink-0 rounded-full"
                :class="feed.dotClass"
              ></span>
              <span class="flex-1 text-[#3F3F3B]">{{ feed.text }}</span>
              <span
                class="ml-auto flex-shrink-0 text-[10.5px] whitespace-nowrap text-[#85857F] sm:text-[11px]"
              >
                {{ feed.time }}
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  </PageShell>
</template>
