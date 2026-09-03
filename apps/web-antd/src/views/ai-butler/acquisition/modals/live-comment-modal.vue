<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockLiveComments } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const followFilter = ref('是否关注');
const msgFilter = ref('是否私信');
const contentQuery = ref('');

const filteredRows = computed(() =>
  mockLiveComments.filter((item) => {
    if (
      followFilter.value !== '是否关注' &&
      item.follow !== followFilter.value
    ) {
      return false;
    }
    if (msgFilter.value !== '是否私信' && item.msg !== msgFilter.value) {
      return false;
    }
    if (contentQuery.value) {
      const keys = contentQuery.value
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean);
      if (
        keys.length > 0 &&
        !keys.some((word) => item.content.includes(word))
      ) {
        return false;
      }
    }
    return true;
  }),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    checkboxConfig: { highlight: true },
    columns: [
      { type: 'checkbox', width: 36 },
      { field: 'room', minWidth: 140, title: '直播间' },
      { field: 'name', minWidth: 110, title: '发送人' },
      { field: 'gender', title: '性别', width: 70 },
      { field: 'content', minWidth: 180, title: '评论内容' },
      { field: 'msg', title: '是否私信', width: 90 },
      { field: 'follow', title: '是否关注', width: 90 },
      { field: 'time', minWidth: 150, title: '添加时间' },
      { slots: { default: 'actions' }, title: '操作', width: 140 },
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
  title: '直播评论列表',
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
  openModal?.('m-batch', { count, source: 'live' });
}

function refreshList() {
  gridApi.setGridOptions({ data: filteredRows.value });
  message.success('列表已刷新');
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Select
        class="w-[130px]"
        :options="[{ label: '小雅来啦', value: '小雅来啦' }]"
        size="small"
        value="小雅来啦"
      />
      <Select
        v-model:value="followFilter"
        class="w-[110px]"
        :options="[
          { label: '是否关注', value: '是否关注' },
          { label: '已关注', value: '已关注' },
          { label: '未关注', value: '未关注' },
        ]"
        size="small"
      />
      <Select
        v-model:value="msgFilter"
        class="w-[110px]"
        :options="[
          { label: '是否私信', value: '是否私信' },
          { label: '已私信', value: '已私信' },
          { label: '未私信', value: '未私信' },
        ]"
        size="small"
      />
      <Input
        v-model:value="contentQuery"
        class="w-[180px]"
        placeholder="评论内容(逗号分隔)"
        size="small"
      />
      <Button size="small" @click="refreshList">刷新</Button>
      <Button size="small" danger @click="message.success('已选择删除')">
        选择删除
      </Button>
      <Button size="small" @click="message.success('已导出')">导出</Button>
      <Button size="small" @click="message.success('老数据已转移归档')">
        老数据转移
      </Button>
    </div>
    <Grid>
      <template #actions>
        <Button
          size="small"
          type="link"
          @click="message.info('已打开直播间（演示）')"
        >
          直播间
        </Button>
        <Button
          size="small"
          type="link"
          @click="message.info('已打开用户主页（演示）')"
        >
          用户主页
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
