<script lang="ts" setup>
import type { Ref } from 'vue';

import type { MockTask } from '../../_shared/mock-data';

import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  acqPlatformLabels,
  acqTaskStatusLabels,
  mockTasks,
} from '../../_shared/mock-data';
import { commentModalKeyForTask } from '../../_shared/task-comment-modal';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const activePlatform = inject<Ref<string> | undefined>('activePlatform');
const statusFilter = ref('全部状态');
const typeFilter = ref('全部类型');

const filteredTasks = computed(() => {
  const current = activePlatform?.value ?? 'douyin';
  return mockTasks.filter((item) => {
    if (item.platform !== current) return false;
    if (
      statusFilter.value !== '全部状态' &&
      item.status !== statusFilter.value
    ) {
      return false;
    }
    if (
      typeFilter.value !== '全部类型' &&
      item.typeLabel !== typeFilter.value
    ) {
      return false;
    }
    return true;
  });
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', minWidth: 140, title: '任务ID' },
      { field: 'name', minWidth: 160, title: '任务名称' },
      { field: 'typeLabel', minWidth: 110, title: '类型' },
      { field: 'accountName', minWidth: 110, title: '执行账号' },
      {
        field: 'platform',
        formatter: ({ cellValue }: { cellValue: string }) =>
          acqPlatformLabels[cellValue] ?? cellValue,
        title: '平台',
        width: 90,
      },
      {
        field: 'status',
        formatter: ({ cellValue }: { cellValue: string }) =>
          acqTaskStatusLabels[cellValue] ?? cellValue,
        title: '状态',
        width: 90,
      },
      { minWidth: 130, slots: { default: 'progress' }, title: '进度' },
      { field: 'createdAt', minWidth: 160, title: '创建时间' },
      { slots: { default: 'actions' }, title: '操作', width: 220 },
    ],
    data: filteredTasks.value,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

watch(filteredTasks, (data) => {
  gridApi.setGridOptions({ data });
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: '任务列表',
});

defineExpose({ modalApi });

function refreshList() {
  gridApi.setGridOptions({ data: filteredTasks.value });
  message.success('列表已刷新');
}

function openDetail(row: MockTask) {
  openModal?.('task-detail-modal', row);
}

function copyTask(row: MockTask) {
  message.success(`已复制任务配置（演示）· ${row.name}`);
}

function viewComments(row: MockTask) {
  openModal?.(commentModalKeyForTask(row.typeLabel), row);
}

function toggleTask(row: MockTask) {
  if (row.status === 'running') {
    message.success(`任务已暂停 · ${row.name}`);
    return;
  }
  if (
    row.status === 'paused' ||
    row.status === 'failed' ||
    row.status === 'pending'
  ) {
    message.success(`任务已恢复执行 · 由本机 RPA 引擎继续`);
    return;
  }
  message.info('当前状态不可暂停或恢复');
}

function toggleLabel(status: string) {
  if (status === 'running') return '暂停';
  if (status === 'paused' || status === 'failed' || status === 'pending') {
    return '恢复';
  }
  return '—';
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Select
        v-model:value="statusFilter"
        class="w-[130px]"
        :options="[
          { label: '全部状态', value: '全部状态' },
          { label: '执行中', value: 'running' },
          { label: '待执行', value: 'pending' },
          { label: '已完成', value: 'success' },
          { label: '已暂停', value: 'paused' },
          { label: '异常', value: 'failed' },
        ]"
        size="small"
      />
      <Select
        v-model:value="typeFilter"
        class="w-[130px]"
        :options="[
          { label: '全部类型', value: '全部类型' },
          { label: '关键词拓客', value: '关键词拓客' },
          { label: '对标拓客', value: '对标拓客' },
          { label: '视频拓客', value: '视频拓客' },
          { label: '直播拓客', value: '直播拓客' },
          { label: '粉丝拓客', value: '粉丝拓客' },
        ]"
        size="small"
      />
      <Button size="small" @click="refreshList">刷新</Button>
      <span class="text-[11.5px] text-[#6B7280]">
        操作说明：「详情」查看任务配置；「一键复制」按相同配置新建任务；「查看评论」进入该任务抓到的评论
      </span>
    </div>
    <Grid>
      <template #progress="{ row }">
        <div class="flex items-center gap-2">
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEEDE8]">
            <div
              class="h-full rounded-full bg-[#111A38]"
              :style="{ width: `${row.progress}%` }"
            ></div>
          </div>
          <span class="text-[11px] text-[#6B7280]">
            {{ row.completed }}/{{ row.total }}
          </span>
        </div>
      </template>
      <template #actions="{ row }">
        <Button size="small" type="link" @click="openDetail(row)">详情</Button>
        <Button size="small" type="link" @click="copyTask(row)">
          一键复制
        </Button>
        <Button size="small" type="link" @click="viewComments(row)">
          查看评论
        </Button>
        <Button
          v-if="toggleLabel(row.status) !== '—'"
          size="small"
          type="link"
          @click="toggleTask(row)"
        >
          {{ toggleLabel(row.status) }}
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
