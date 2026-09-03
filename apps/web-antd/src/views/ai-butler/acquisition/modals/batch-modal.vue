<script lang="ts" setup>
import type { Ref } from 'vue';

import { inject } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

import {
  getAcqAccountOptions,
  mockReplyPresets,
} from '../../_shared/mock-data';

const activePlatform = inject<Ref<string> | undefined>('activePlatform');

const presetOptions = [
  { label: '预设 · 获客', value: 'guest' },
  { label: '预设 · 售后', value: 'aftersale' },
  { label: '直接输入', value: 'custom' },
];

const [Form, formApi] = useVbenForm({
  handleSubmit(values) {
    if (!values.dm && !values.follow) {
      message.warning('请至少选择一项触达动作（私信 / 关注）');
      return;
    }
    const acts = [values.dm ? '私信' : '', values.follow ? '关注' : '']
      .filter(Boolean)
      .join(' + ');
    message.success(
      `批量任务已提交 · 执行账号「${values.account}」· ${acts} · 按间隔逐个执行，进度见运行进程管理`,
    );
    modalApi.close();
  },
  schema: [
    {
      component: 'Select',
      componentProps: () => ({
        class: 'w-full',
        options: getAcqAccountOptions(activePlatform?.value ?? 'douyin'),
      }),
      fieldName: 'account',
      label: '执行账号',
      rules: 'selectRequired',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'dm',
      label: '私信',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'follow',
      label: '关注',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 60,
      fieldName: 'gap',
      label: '私信间隔（秒）',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: presetOptions,
      },
      defaultValue: 'guest',
      fieldName: 'preset',
      help: mockReplyPresets[0]
        ? `获客预设：${mockReplyPresets[0].content}`
        : undefined,
      label: '私信内容',
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '输入私信内容，将按间隔逐个发送给选中用户',
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

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  confirmText: '确定执行',
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmit();
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData() as undefined | { count?: number };
    const count = data?.count ?? 0;
    modalApi.setState({
      title: count
        ? `更多操作 · 批量触达（已选 ${count} 人）`
        : '更多操作 · 批量触达',
    });
  },
  title: '更多操作 · 批量触达',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <Form />
    <div
      class="mt-3 flex gap-2 rounded-[10px] border border-[#DDE1F2] bg-[linear-gradient(90deg,#F5F7FF,#FAF7FF)] px-3 py-2 text-[11.5px] leading-relaxed text-[#4D566D]"
    >
      <span class="shrink-0">💡</span>
      <span>
        将对勾选的用户按配置批量私信 /
        关注；数量与间隔请合理设置，避免触发平台风控。
      </span>
    </div>
  </Modal>
</template>
