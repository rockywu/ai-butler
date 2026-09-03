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
      component: 'Textarea',
      componentProps: {
        placeholder: '粘贴爆款作品视频链接，一行一个',
        rows: 3,
      },
      defaultValue:
        'https://v.douyin.com/****video1\nhttps://v.douyin.com/****video2',
      fieldName: 'videoLinks',
      formItemClass: 'sm:col-span-2',
      help: '获取方式：打开目标视频 → 分享 → 复制链接，粘贴后自动删减多余文字；留空整行可跳过',
      label: '目标作品视频链接（可多个，一行一个）',
      rules: z.string().min(1, { message: '请输入目标作品视频链接' }),
    },
    {
      component: 'Input',
      defaultValue: '多少钱,怎么买,求推荐',
      fieldName: 'hitKeywords',
      formItemClass: 'sm:col-span-2',
      label: '评论筛选关键词（英文逗号分隔，命中后触发触达）',
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '私信', value: 'dm' },
          { label: '评论回复', value: 'reply' },
          { label: '点赞', value: 'like' },
          { label: '关注', value: 'follow' },
        ],
      },
      defaultValue: ['dm', 'reply'],
      fieldName: 'actions',
      formItemClass: 'sm:col-span-2',
      label: '触达动作',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 20,
      fieldName: 'dmCount',
      label: '私信数量（条/日）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 70,
      fieldName: 'dmGap',
      label: '私信间隔（秒）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 15,
      fieldName: 'cmtCount',
      label: '评论数量（条/日）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 100,
      fieldName: 'cmtGap',
      label: '评论间隔（秒）',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'hiddenMode',
      help: '不推荐开启',
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
  title: '视频拓客 · 新建任务',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <Form />
  </Modal>
</template>
