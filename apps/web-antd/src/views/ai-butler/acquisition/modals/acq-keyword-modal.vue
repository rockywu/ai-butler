<script lang="ts" setup>
import type { Ref } from 'vue';

import { inject } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

import {
  acqRegionOptions,
  getAcqAccountOptions,
} from '../../_shared/mock-data';

const activePlatform = inject<Ref<string> | undefined>('activePlatform');

const [Form, formApi] = useVbenForm({
  handleSubmit() {
    message.success('任务已提交，由本机 RPA 引擎执行（演示）');
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
      help: '多开任务须选择不同账号',
      label: '执行账号',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '输入一个搜索关键词',
      },
      defaultValue: '家居好物',
      fieldName: 'keyword',
      help: '每任务仅一个；全平台搜索、非精准筛选',
      label: '搜索关键词',
      rules: z.string().min(1, { message: '请输入搜索关键词' }),
    },
    {
      component: 'Input',
      defaultValue: '多少钱,怎么买,有链接吗',
      fieldName: 'hitKeywords',
      formItemClass: 'sm:col-span-2',
      label: '命中关键词',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: acqRegionOptions,
      },
      defaultValue: '不限',
      fieldName: 'region',
      label: '地区',
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '私信（含 AI 自动回复）', value: 'dm' },
          { label: '点赞', value: 'like' },
          { label: '评论回复', value: 'reply' },
          { label: '关注', value: 'follow' },
        ],
      },
      defaultValue: ['dm', 'like'],
      fieldName: 'actions',
      formItemClass: 'sm:col-span-2',
      label: '触达动作',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 30,
      fieldName: 'dmCount',
      label: '私信数量（条/日）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 60,
      fieldName: 'dmGap',
      label: '私信间隔（秒）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 20,
      fieldName: 'cmtCount',
      label: '评论数量（条/日）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 90,
      fieldName: 'cmtGap',
      label: '评论间隔（秒）',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'hiddenMode',
      help: '不推荐开启：隐藏执行易被平台识别为异常行为',
      label: '隐藏模式',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'compatMode',
      label: '兼容模式',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] md:w-[640px]',
  confirmText: '提交任务',
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmit();
  },
  title: '关键词拓客 · 新建任务',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
