<script lang="ts" setup>
import type { Ref } from 'vue';

import { inject } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

import { getAcqAccountOptions } from '../../_shared/mock-data';

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
        placeholder: '粘贴直播间地址',
      },
      defaultValue: 'https://live.douyin.com/****',
      fieldName: 'liveUrl',
      help: '⚠ 开启了匿名保护的直播间无法获取评论，任务将提示无数据',
      label: '直播间地址（仅一个）',
      rules: z.string().min(1, { message: '请输入直播间地址' }),
    },
    {
      component: 'Input',
      defaultValue: '多少钱,怎么买,优惠,链接',
      fieldName: 'hitKeywords',
      formItemClass: 'sm:col-span-2',
      label: '弹幕关键词（英文逗号分隔，命中后触发触达）',
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '私信', value: 'dm' },
          { label: '弹幕回复', value: 'reply' },
          { label: '关注', value: 'follow' },
        ],
      },
      defaultValue: ['dm'],
      fieldName: 'actions',
      formItemClass: 'sm:col-span-2',
      label: '触达动作',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 50,
      fieldName: 'dmCount',
      label: '私信数量（条/日）',
    },
    {
      component: 'InputNumber',
      componentProps: { class: 'w-full', min: 1 },
      defaultValue: 45,
      fieldName: 'dmGap',
      label: '私信间隔（秒）',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'compatMode',
      formItemClass: 'sm:col-span-2',
      help: '直播间界面变化频繁，建议开启',
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
  title: '直播拓客 · 新建任务',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <Form />
    <div class="mt-3 text-[11.5px] leading-relaxed text-[#6B7280]">
      📺 直播间实时监听，主播下播后任务自动暂停；匿名保护直播间无法获取评论
    </div>
  </Modal>
</template>
