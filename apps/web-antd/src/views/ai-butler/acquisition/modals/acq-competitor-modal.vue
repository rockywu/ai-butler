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
      help: '多开任务须选择不同账号，否则任务无法同时执行',
      label: '执行账号',
      rules: 'selectRequired',
    },
    {
      component: 'Input',
      componentProps: {
        placeholder: '粘贴对标账号主页链接',
      },
      defaultValue: 'https://v.douyin.com/****competitor',
      fieldName: 'link',
      help: '获取方式：进入对标作者主页 → 右上角「···」→ 分享名片 → 复制链接；粘贴后系统自动删减链接以外的多余文字',
      label: '对标账号主页链接（仅一个）',
      rules: z.string().min(1, { message: '请输入对标账号主页链接' }),
    },
    {
      component: 'Input',
      defaultValue: '多少钱,怎么买,有链接吗',
      fieldName: 'hitKeywords',
      formItemClass: 'sm:col-span-2',
      label: '命中关键词（英文逗号分隔，命中后触发触达）',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: acqRegionOptions,
      },
      defaultValue: '不限',
      fieldName: 'region',
      label: '地区（省 / 直辖市）',
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '私信', value: 'dm' },
          { label: '点赞', value: 'like' },
          { label: '关注', value: 'follow' },
          { label: '评论回复', value: 'reply' },
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
      help: '不推荐开启：隐藏执行易被平台识别为异常行为，建议关闭',
      label: '隐藏模式',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'compatMode',
      help: '界面容错更强，速度略降；平台改版期建议开启',
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
  title: '对标拓客 · 新建任务',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <Form />
    <div class="mt-3 text-[11.5px] leading-relaxed text-[#6B7280]">
      🤖 任务由本机 RPA
      引擎在客户端内执行，进度实时回传云端；新账号建议先养号，数量间隔合理设置防风控
    </div>
  </Modal>
</template>
