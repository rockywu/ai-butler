<script lang="ts" setup>
import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockComments } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const typeFilter = ref('获客类型');
const followFilter = ref('是否关注');
const msgFilter = ref('是否私信');
const videoQuery = ref('');
const contentQuery = ref('');

const filteredRows = computed(() =>
  mockComments.filter((item) => {
    if (typeFilter.value !== '获客类型' && item.type !== typeFilter.value) {
      return false;
    }
    if (
      followFilter.value !== '是否关注' &&
      item.follow !== followFilter.value
    ) {
      return false;
    }
    if (msgFilter.value !== '是否私信' && item.msg !== msgFilter.value) {
      return false;
    }
    if (videoQuery.value && !item.video.includes(videoQuery.value)) {
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
      { field: 'video', minWidth: 160, title: '视频标题' },
      { field: 'type', title: '获客类型', width: 90 },
      { field: 'name', minWidth: 110, title: '发送人' },
      { field: 'content', minWidth: 200, title: '评论内容' },
      { field: 'ip', title: '评论IP', width: 80 },
      { field: 'msg', title: '是否私信', width: 90 },
      { field: 'follow', title: '是否关注', width: 90 },
      { field: 'time', minWidth: 150, title: '评论时间' },
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
  title: '数据评论列表',
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
  openModal?.('m-batch', { count, source: 'comment' });
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
        :options="[
          { label: '小雅来啦', value: '小雅来啦' },
          { label: '品牌官号-01', value: '品牌官号-01' },
        ]"
        size="small"
        value="小雅来啦"
      />
      <Select
        v-model:value="typeFilter"
        class="w-[110px]"
        :options="[
          { label: '获客类型', value: '获客类型' },
          { label: '关键词', value: '关键词' },
          { label: '对标', value: '对标' },
          { label: '视频', value: '视频' },
        ]"
        size="small"
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
        v-model:value="videoQuery"
        class="w-[140px]"
        placeholder="请输入视频名称"
        size="small"
      />
      <Input
        v-model:value="contentQuery"
        class="w-[180px]"
        placeholder="评论内容(逗号分隔)"
        size="small"
      />
      <Button
        size="small"
        type="primary"
        @click="message.info('已显示更多筛选')"
      >
        更多
      </Button>
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
          @click="message.info('已打开原视频（演示）')"
        >
          原视频
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
