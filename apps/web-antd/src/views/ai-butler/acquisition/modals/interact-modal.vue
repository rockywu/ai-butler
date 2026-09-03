<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockInteracts } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const actionFilter = ref('全部动作');

const filteredRows = computed(() =>
  mockInteracts.filter(
    (item) =>
      actionFilter.value === '全部动作' || item.action === actionFilter.value,
  ),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    checkboxConfig: { highlight: true },
    columns: [
      { type: 'checkbox', width: 36 },
      { field: 'name', minWidth: 120, title: '用户' },
      { field: 'action', title: '动作', width: 100 },
      { field: 'content', minWidth: 220, title: '内容' },
      { field: 'time', title: '时间', width: 90 },
      { field: 'status', title: '状态', width: 90 },
    ],
    data: filteredRows.value,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

watch(filteredRows, (data) => {
  gridApi.setGridOptions({ data });
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  confirmText: '更多操作（私信 / 关注）',
  fullscreenButton: true,
  onConfirm() {
    openBatch();
  },
  title: '互动记录列表',
});

defineExpose({ modalApi });

function selectedCount() {
  return gridApi.grid.getCheckboxRecords?.()?.length ?? 0;
}

function openBatch() {
  const count = selectedCount();
  if (count === 0) {
    message.warning('请先勾选要触达的用户');
    return;
  }
  openModal?.('m-batch', { count, source: 'interact' });
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Select
        v-model:value="actionFilter"
        class="w-[130px]"
        :options="[
          { label: '全部动作', value: '全部动作' },
          { label: '私信', value: '私信' },
          { label: '关注', value: '关注' },
          { label: '点赞', value: '点赞' },
          { label: '评论回复', value: '评论回复' },
        ]"
        size="small"
      />
      <Button size="small" type="primary" @click="message.success('已搜索')">
        搜索
      </Button>
      <Button size="small" @click="message.success('已导出')">导出</Button>
    </div>
    <Grid />
  </Modal>
</template>
