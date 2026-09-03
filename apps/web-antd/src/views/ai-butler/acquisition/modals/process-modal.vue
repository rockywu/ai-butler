<script lang="ts" setup>
import type { Ref } from 'vue';

import { computed, inject, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { acqPlatformLabels, mockProcesses } from '../../_shared/mock-data';

const activePlatform = inject<Ref<string> | undefined>('activePlatform');
const platformFilter = ref('当前平台');
const typeFilter = ref('全部来源');

const filteredProcesses = computed(() => {
  const current = activePlatform?.value ?? 'douyin';
  return mockProcesses.filter((item) => {
    if (platformFilter.value === '当前平台' && item.platform !== current) {
      return false;
    }
    if (
      platformFilter.value !== '当前平台' &&
      platformFilter.value !== '全部平台' &&
      item.platform !== platformFilter.value
    ) {
      return false;
    }
    if (typeFilter.value !== '全部来源' && item.type !== typeFilter.value) {
      return false;
    }
    return true;
  });
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', minWidth: 140, title: '进程ID' },
      { field: 'account', minWidth: 110, title: '执行账号' },
      {
        field: 'platform',
        formatter: ({ cellValue }: { cellValue: string }) =>
          acqPlatformLabels[cellValue] ?? cellValue,
        title: '平台',
        width: 90,
      },
      { field: 'target', minWidth: 140, title: '获客链接/关键词' },
      { field: 'type', minWidth: 110, title: '拓客类型' },
      { field: 'msg', title: '私信', width: 70 },
      { field: 'follow', title: '关注', width: 70 },
      { field: 'like', title: '点赞', width: 70 },
      { field: 'reply', title: '回复', width: 70 },
      { field: 'createdAt', minWidth: 160, title: '创建时间' },
      { slots: { default: 'actions' }, title: '操作', width: 90 },
    ],
    data: filteredProcesses.value,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

watch(filteredProcesses, (data) => {
  gridApi.setGridOptions({ data });
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: '运行进程管理',
});

defineExpose({ modalApi });

function refreshList() {
  gridApi.setGridOptions({ data: filteredProcesses.value });
  message.success('进程列表已刷新');
}

function stopProcess(id: string) {
  message.success(`进程 ${id} 已停止`);
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Select
        v-model:value="platformFilter"
        class="w-[130px]"
        :options="[
          { label: '当前平台', value: '当前平台' },
          { label: '全部平台', value: '全部平台' },
          { label: '某音', value: 'douyin' },
          { label: '小某书', value: 'xiaohongshu' },
          { label: '某手', value: 'kuaishou' },
        ]"
        size="small"
      />
      <Select
        v-model:value="typeFilter"
        class="w-[140px]"
        :options="[
          { label: '全部来源', value: '全部来源' },
          { label: '关键词拓客', value: '关键词拓客' },
          { label: '对标拓客', value: '对标拓客' },
          { label: '视频拓客', value: '视频拓客' },
          { label: '直播拓客', value: '直播拓客' },
          { label: '粉丝拓客', value: '粉丝拓客' },
        ]"
        size="small"
      />
      <Button size="small" type="primary" @click="refreshList">刷新</Button>
      <span class="text-[11.5px] text-[#6B7280]">
        进程由本机 RPA 引擎执行，异常时可关闭任务浏览器后刷新
      </span>
    </div>
    <Grid>
      <template #actions="{ row }">
        <Button size="small" type="link" @click="stopProcess(row.id)">
          停止
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
