<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

const [Form, formApi] = useVbenForm({
  handleSubmit() {
    message.success('已导入到个微加好友任务（演示）');
    modalApi.close();
  },
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: '个微（加好友任务）', value: 'gewei' },
          { label: '企微（加好友任务）', value: 'qiwei' },
        ],
      },
      defaultValue: 'gewei',
      fieldName: 'target',
      formItemClass: 'sm:col-span-2',
      label: '导入到',
      rules: z.string().min(1, { message: '请选择导入目标' }),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        optionType: 'button',
        options: [
          { label: '仅已留联系方式的联系人', value: 'contact' },
          { label: '全部联系人', value: 'all' },
        ],
      },
      defaultValue: 'contact',
      fieldName: 'scope',
      formItemClass: 'sm:col-span-2',
      label: '导入范围',
      rules: z.string().min(1, { message: '请选择导入范围' }),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  confirmText: '确认导入',
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  async onConfirm() {
    await formApi.validateAndSubmit();
  },
  title: '导入好友任务',
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
        客资将导入对应 AI 智能个微 / 企微
        的好友任务，由智能体执行添加与后续跟进；未留联系方式的联系人将跳过。
      </span>
    </div>
  </Modal>
</template>
