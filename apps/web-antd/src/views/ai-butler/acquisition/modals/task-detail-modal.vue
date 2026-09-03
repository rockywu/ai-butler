<script lang="ts" setup>
import type { MockTask } from '../../_shared/mock-data';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import {
  acqPlatformLabels,
  acqTaskStatusLabels,
} from '../../_shared/mock-data';

const task = ref<MockTask>();

const settingsEntries = computed(() =>
  Object.entries(task.value?.settings ?? {}),
);

const commentBtnText = computed(() => {
  if (task.value?.typeLabel === '直播拓客') return '查看直播评论';
  if (task.value?.typeLabel === '粉丝拓客') return '查看粉丝列表';
  return '查看评论';
});

const [Modal, modalApi] = useVbenModal<MockTask>({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  fullscreenButton: true,
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData();
    task.value = data;
    modalApi.setState({
      title: data?.name ? `任务详情 · ${data.name}` : '任务详情',
    });
  },
  showConfirmButton: false,
  title: '任务详情',
});

defineExpose({ modalApi });

function copyTask() {
  if (!task.value) return;
  message.success(`已复制任务配置（演示）· ${task.value.name}`);
}

function viewComments() {
  if (!task.value) return;
  if (task.value.typeLabel === '直播拓客') {
    message.info('查看直播评论（演示）');
    return;
  }
  if (task.value.typeLabel === '粉丝拓客') {
    message.info('查看粉丝列表（演示）');
    return;
  }
  message.info(`已打开「${task.value.name}」抓取的评论（演示）`);
}
</script>

<template>
  <Modal>
    <dl
      v-if="task"
      class="mb-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[12.5px]"
    >
      <dt class="text-[#6B7280]">任务ID</dt>
      <dd class="font-mono text-[#0A0A0A]">{{ task.id }}</dd>
      <dt class="text-[#6B7280]">状态</dt>
      <dd class="text-[#0A0A0A]">
        {{ acqTaskStatusLabels[task.status] ?? task.status }} · 进度
        {{ task.completed }}/{{ task.total }}（{{ task.progress }}%）
      </dd>
      <dt class="text-[#6B7280]">执行账号</dt>
      <dd class="text-[#0A0A0A]">
        {{ task.accountName }} ·
        {{ acqPlatformLabels[task.platform] ?? task.platform }}
      </dd>
      <dt class="text-[#6B7280]">创建时间</dt>
      <dd class="text-[#0A0A0A]">{{ task.createdAt }}</dd>
    </dl>
    <div class="mb-2 text-[12.5px] font-semibold text-[#0A0A0A]">任务配置</div>
    <dl class="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-[12.5px]">
      <template v-for="[label, value] in settingsEntries" :key="label">
        <dt class="text-[#6B7280]">{{ label }}</dt>
        <dd class="break-all text-[#0A0A0A]">{{ value }}</dd>
      </template>
    </dl>
    <template #append-footer>
      <Button size="small" @click="copyTask">
        ⧉ 一键复制（按此配置开新任务）
      </Button>
      <Button size="small" type="primary" @click="viewComments">
        {{ commentBtnText }}
      </Button>
    </template>
  </Modal>
</template>
