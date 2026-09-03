<script lang="ts" setup>
import type { Ref } from 'vue';

import { computed, inject, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { acqPlatformLabels, mockAccounts } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const activePlatform = inject<Ref<string> | undefined>('activePlatform');

const filteredAccounts = computed(() =>
  mockAccounts.filter(
    (account) => account.platform === (activePlatform?.value ?? 'douyin'),
  ),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'nickname', minWidth: 120, title: '账号昵称' },
      { field: 'gender', title: '性别', width: 70 },
      { field: 'agent', minWidth: 160, title: '应用信息（绑定智能体）' },
      {
        field: 'platform',
        formatter: ({ cellValue }: { cellValue: string }) =>
          acqPlatformLabels[cellValue] ?? cellValue,
        title: '平台',
        width: 90,
      },
      { field: 'createdAt', minWidth: 160, title: '创建时间' },
      { field: 'initTimeout', title: '初始化(秒)', width: 100 },
      { field: 'maxPrivateMsg', title: '同时私信数', width: 110 },
      {
        field: 'listenOn',
        formatter: ({ cellValue }: { cellValue: boolean }) =>
          cellValue ? '开' : '关',
        title: '监听',
        width: 80,
      },
      { slots: { default: 'actions' }, title: '操作', width: 220 },
    ],
    data: filteredAccounts.value,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

watch(filteredAccounts, (data) => {
  gridApi.setGridOptions({ data });
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: '账号管理 · 某音',
});

defineExpose({ modalApi });

function openAuth() {
  openModal?.('auth-modal');
}

function refreshList() {
  gridApi.setGridOptions({ data: filteredAccounts.value });
  message.success('账号列表已刷新');
}

function bindAgent() {
  message.info('绑定智能体（演示）');
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Button size="small" type="primary" @click="openAuth">＋ 授权账号</Button>
      <Button size="small" @click="refreshList">刷新</Button>
      <span class="text-[11.5px] text-[#6B7280]">
        授权在客户端内完成（本地 RPA
        登录态）；同一平台可授权多个账号做矩阵截流；多任务并行时须选择不同账号执行
      </span>
    </div>
    <Grid>
      <template #actions>
        <Button size="small" type="link" @click="bindAgent">绑定智能体</Button>
      </template>
    </Grid>
    <div
      class="mt-3 flex gap-2 rounded-[10px] border border-[#DDE1F2] bg-[linear-gradient(90deg,#F5F7FF,#FAF7FF)] px-3 py-2 text-[11.5px] leading-relaxed text-[#4D566D]"
    >
      <span class="shrink-0">💡</span>
      <span>
        新授权账号建议先<strong>养号</strong>（完善资料、保持活跃）再执行拓客任务；私信
        /
        评论的<strong>数量与间隔</strong>请合理设置，频率过高易触发平台风控。绑定智能体后，务必先<strong>开启监听</strong>再<strong>拉取会话</strong>，AI
        才会接管私信回复；关闭监听 = 本账号不 AI 接管。
      </span>
    </div>
  </Modal>
</template>
