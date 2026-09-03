<script lang="ts" setup>
import type { Ref } from 'vue';

import type { MockFan } from '../../_shared/mock-data';

import { inject, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { getAcqAccountOptions, mockFans } from '../../_shared/mock-data';

type OpenModalFn = (key: string, data?: unknown) => void;

const openModal = inject<OpenModalFn | undefined>('openModal');
const activePlatform = inject<Ref<string> | undefined>('activePlatform');

const collected = ref(false);
const collecting = ref(false);

const [SourceForm, sourceFormApi] = useVbenForm({
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: '自有粉丝（采集我的账号粉丝）', value: 'own' },
          { label: '对标粉丝（采集对标账号粉丝）', value: 'rival' },
        ],
      },
      defaultValue: 'own',
      fieldName: 'source',
      formItemClass: 'sm:col-span-2',
      label: '粉丝来源',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: () => ({
        class: 'w-full',
        options: getAcqAccountOptions(activePlatform?.value ?? 'douyin'),
      }),
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.source === 'rival' ? null : 'selectRequired',
          show: values.source !== 'rival',
        }),
        triggerFields: ['source'],
      },
      fieldName: 'account',
      label: '选择账号',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '粘贴对标账号主页链接',
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules:
            values.source === 'rival'
              ? z.string().min(1, { message: '请粘贴对标账号主页链接' })
              : null,
          show: values.source === 'rival',
        }),
        triggerFields: ['source'],
      },
      fieldName: 'rivalLink',
      formItemClass: 'sm:col-span-2',
      help: '进入对标作者主页 → 右上角「···」→ 分享名片 → 复制链接',
      label: '对标账号主页链接',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [ReachForm, reachFormApi] = useVbenForm({
  handleSubmit(values) {
    if (!values.dm) {
      message.warning('私信开关已关闭，请开启后再开始');
      return;
    }
    const selected = gridApi.grid.getCheckboxRecords?.() ?? [];
    const count = selected.length;
    const rate = values.rate === '50' ? 50 : 100;
    const sendN = rate === 100 ? count : Math.max(1, Math.round(count / 2));
    message.success(
      `私信任务已提交 · ${sendN} 位粉丝 · 间隔 ${values.gap} 秒 · 由本机 RPA 引擎执行`,
    );
    modalApi.close();
  },
  schema: [
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'dm',
      help: '对选中粉丝发送私信',
      label: '私信',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: '100%（全部）', value: '100' },
          { label: '50%（按概率）', value: '50' },
        ],
      },
      defaultValue: '100',
      fieldName: 'rate',
      label: '私信百分比',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 90,
      fieldName: 'gap',
      label: '私信间隔（秒）',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: [
          { label: '预设 · 获客私信（唤醒老粉）', value: 'guest' },
          { label: '预设 · 新品活动通知', value: 'notice' },
          { label: '直接输入', value: 'custom' },
        ],
      },
      defaultValue: 'guest',
      fieldName: 'preset',
      label: '私信内容',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '输入私信内容，将按间隔逐个发送给选中粉丝',
        rows: 3,
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules:
            values.preset === 'custom'
              ? z.string().min(1, { message: '请输入私信内容' })
              : null,
          show: values.preset === 'custom',
        }),
        triggerFields: ['preset'],
      },
      fieldName: 'customContent',
      formItemClass: 'sm:col-span-2',
      label: '直接输入私信内容',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [Grid, gridApi] = useVbenVxeGrid<MockFan>({
  gridEvents: {
    checkboxAll() {
      syncConfirmDisabled();
    },
    checkboxChange() {
      syncConfirmDisabled();
    },
  },
  gridOptions: {
    checkboxConfig: { highlight: true },
    columns: [
      { type: 'checkbox', width: 36 },
      { field: 'name', minWidth: 110, title: '名称' },
      { field: 'signature', minWidth: 140, title: '个性签名' },
      { field: 'fans', title: '粉丝数', width: 80 },
      { field: 'works', title: '作品数', width: 80 },
      { field: 'msg', title: '是否私信', width: 90 },
      { field: 'followBack', title: '是否关注', width: 90 },
    ],
    data: [] as MockFan[],
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  confirmDisabled: true,
  confirmText: '开始私信',
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    const selected = gridApi.grid.getCheckboxRecords?.() ?? [];
    if (!collected.value || selected.length === 0) {
      message.warning('请先勾选要私信的粉丝');
      return;
    }
    await reachFormApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    resetCollect();
  },
  title: '粉丝拓客 · 新建任务',
});

defineExpose({ modalApi });

function selectedCount() {
  return gridApi.grid.getCheckboxRecords?.()?.length ?? 0;
}

function syncConfirmDisabled() {
  modalApi.setState({
    confirmDisabled: !collected.value || selectedCount() === 0,
    confirmText: '开始私信',
  });
}

function resetCollect() {
  collected.value = false;
  collecting.value = false;
  gridApi.setGridOptions({ data: [] });
  syncConfirmDisabled();
}

async function startCollect() {
  const { valid } = await sourceFormApi.validate();
  if (!valid) return;
  collecting.value = true;
  message.info('已打开任务浏览器 · 正在自动翻页采集粉丝');
  window.setTimeout(async () => {
    collected.value = true;
    collecting.value = false;
    await nextTick();
    gridApi.setGridOptions({ data: mockFans });
    message.success('采集完成 · 浏览器已自动关闭，共获取 3 位粉丝');
    syncConfirmDisabled();
  }, 800);
}

function openBatch() {
  openModal?.('m-batch', { count: selectedCount(), source: 'fan' });
}
</script>

<template>
  <Modal>
    <SourceForm />
    <div class="mt-3 flex flex-wrap items-center gap-2.5">
      <Button
        :disabled="collecting"
        size="small"
        type="primary"
        @click="startCollect"
      >
        {{ collected ? '↻ 重新采集' : '▶ 开始采集' }}
      </Button>
      <span class="text-[11.5px] text-[#6B7280]">
        {{
          collecting
            ? '浏览器自动打开并翻页抓取粉丝列表，请勿操作…'
            : collected
              ? '采集完成，浏览器已自动关闭；勾选要触达的粉丝并配置私信'
              : '采集过程浏览器自动打开并翻页抓取，完成后自动关闭；已采集的粉丝可在下方勾选触达'
        }}
      </span>
    </div>
    <div v-show="collected" class="mt-3">
      <div class="mb-2 flex flex-wrap items-center gap-2">
        <span
          class="rounded-full bg-[#ECFDF5] px-2 py-0.5 text-[11.5px] font-medium text-[#047857]"
        >
          已采集 3 位粉丝
        </span>
        <Button size="small" @click="openBatch">
          更多操作（私信 / 关注）
        </Button>
        <span class="text-[11.5px] text-[#6B7280]">
          勾选要触达的粉丝，再配置私信内容与频率
        </span>
      </div>
      <Grid />
      <div class="mt-3">
        <ReachForm />
      </div>
    </div>
    <div class="mt-3 text-[11.5px] leading-relaxed text-[#B45309]">
      ⚠ 粉丝批量触达有风控风险，建议低频少量、配合一机一号环境使用
    </div>
  </Modal>
</template>
