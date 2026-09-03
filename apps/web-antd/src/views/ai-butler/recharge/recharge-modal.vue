<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      class:
        '!flex !flex-col gap-2 sm:!flex-row sm:flex-wrap [&_.ant-radio-button-wrapper]:w-full sm:[&_.ant-radio-button-wrapper]:w-auto',
      options: [
        { label: '¥100 · 1,000 点', value: 1000 },
        { label: '¥500 · 5,500 点（加赠 10%）', value: 5500 },
        { label: '¥2,000 · 24,000 点（加赠 20%）', value: 24_000 },
      ],
      optionType: 'button',
    },
    defaultValue: 1000,
    fieldName: 'plan',
    label: '充值套餐',
    rules: 'selectRequired',
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      class: '!flex !flex-wrap gap-2 [&_.ant-radio-button-wrapper]:min-w-0',
      options: [
        { label: '微信支付', value: 'wx' },
        { label: '支付宝', value: 'alipay' },
      ],
      optionType: 'button',
    },
    defaultValue: 'wx',
    fieldName: 'payment',
    label: '支付方式',
    rules: 'selectRequired',
  },
];

const [Form, formApi] = useVbenForm({
  handleSubmit() {
    message.success('演示环境：已生成充值订单，请联系运营完成支付');
    modalApi.close();
  },
  schema,
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  fullscreenButton: true,
  async onConfirm() {
    await formApi.validateAndSubmit();
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal confirm-text="去支付" title="⚡ 算力点充值">
    <div
      class="mb-4 rounded-lg border border-[#D9D8D1] bg-[#F7F7F4] px-3 py-2 text-sm"
    >
      当前余额：<b>1,000</b> 点 · 到期时间 2027-11-26 14:50
    </div>
    <Form />
    <p class="mt-3 text-xs text-[#77736B]">
      算力点用于生成类功能：数字人视频 50 点/条、文生视频 10-30 点/条、配音 5
      点/百字；获客任务不消耗算力点。
    </p>
  </Modal>
</template>
