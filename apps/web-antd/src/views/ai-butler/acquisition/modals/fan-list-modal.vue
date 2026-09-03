<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockFans } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const followFilter = ref('关注状态');
const msgFilter = ref('私信状态');
const nameQuery = ref('');

const filteredRows = computed(() =>
  mockFans.filter((item) => {
    if (
      followFilter.value !== '关注状态' &&
      item.followBack !== followFilter.value
    ) {
      return false;
    }
    if (msgFilter.value !== '私信状态' && item.msg !== msgFilter.value) {
      return false;
    }
    if (nameQuery.value) {
      const keys = nameQuery.value
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean);
      if (keys.length > 0 && !keys.some((word) => item.name.includes(word))) {
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
      { field: 'name', minWidth: 110, title: '名称' },
      { field: 'signature', minWidth: 140, title: '个性签名' },
      { field: 'fans', title: '粉丝数', width: 80 },
      { field: 'follows', title: '关注数', width: 80 },
      { field: 'works', title: '作品数', width: 80 },
      { field: 'likes', title: '获赞数', width: 80 },
      { field: 'status', title: '状态', width: 80 },
      { field: 'msg', title: '是否私信', width: 90 },
      { field: 'followBack', title: '是否关注', width: 90 },
      { field: 'createdAt', minWidth: 150, title: '创建时间' },
      { slots: { default: 'actions' }, title: '操作', width: 80 },
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
  title: '粉丝列表',
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
  openModal?.('m-batch', { count, source: 'fanlist' });
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
          { label: '关注状态', value: '关注状态' },
          { label: '已关注', value: '已关注' },
          { label: '未关注', value: '未关注' },
        ]"
        size="small"
      />
      <Select
        v-model:value="msgFilter"
        class="w-[110px]"
        :options="[
          { label: '私信状态', value: '私信状态' },
          { label: '已私信', value: '已私信' },
          { label: '未私信', value: '未私信' },
        ]"
        size="small"
      />
      <Input
        v-model:value="nameQuery"
        class="w-[180px]"
        placeholder="用户昵称(逗号分隔)"
        size="small"
      />
      <Button size="small" @click="refreshList">刷新</Button>
      <Button size="small" danger @click="message.success('已选择删除')">
        选择删除
      </Button>
      <Button size="small" @click="message.success('已导出')">导出</Button>
    </div>
    <Grid>
      <template #actions>
        <Button
          size="small"
          type="link"
          @click="message.info('已打开用户主页（演示）')"
        >
          主页
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
