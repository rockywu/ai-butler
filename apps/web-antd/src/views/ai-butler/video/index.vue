<script lang="ts" setup>
import type { PreviewMedia } from '../_shared/preview-modal.vue';
import type { VideoEngine } from '../_shared/video-cost';

import { computed, h, ref } from 'vue';

import { Button, Card, message, Radio, Tag } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

import { cardClass, primaryBtnClass } from '../_shared/chic-classes';
import PageShell from '../_shared/page-shell.vue';
import PreviewModal from '../_shared/preview-modal.vue';
import { calcVideoCost } from '../_shared/video-cost';

type ModalExpose = {
  modalApi: {
    open: () => void;
    setData: (data: PreviewMedia) => void;
  };
};

type CostInput = {
  duration: '5s' | '10s';
  engine: VideoEngine;
  quality: '720P' | '1080P';
};

const radioButtonProps = {
  buttonStyle: 'solid' as const,
  optionType: 'button' as const,
};

function mockUploadRequest(options: { onSuccess?: (body?: unknown) => void }) {
  options.onSuccess?.('ok');
}

const engines: { key: VideoEngine; sub: string; title: string }[] = [
  { key: 'Seedance', title: 'Seedance', sub: '画面细腻 · 适合品牌宣传' },
  { key: 'Grok', title: 'Grok Imagine', sub: '创意脑洞 · 适合流量内容' },
  { key: 'VEO', title: 'VEO', sub: '三图生成 · 动作连贯' },
];

const examplePrompts = [
  '阳光穿过森林，镜头缓慢推进',
  '产品特写旋转展示，棚拍质感',
  '美食制作过程，热气腾腾，俯拍',
];

const works = [
  {
    id: 'w1',
    title: '城市夜景航拍，霓虹灯流动，电影感镜头缓慢推进',
    engine: 'Seedance',
    dur: '10s',
    ratio: '16:9',
    quality: '1080P',
    cost: 30,
    time: '2026-08-29 21:05',
    color: 'linear-gradient(135deg,#0EA5E9,#4B3FE3)',
  },
  {
    id: 'w2',
    title: '阳光穿过森林，镜头缓慢推进，唯美氛围',
    engine: 'Grok',
    dur: '5s',
    ratio: '9:16',
    quality: '720P',
    cost: 10,
    time: '2026-08-27 10:40',
    color: 'linear-gradient(135deg,#10B981,#06B6D4)',
  },
];

const previewModalRef = ref<ModalExpose>();
const points = ref(1000);
const costInput = ref<CostInput>({
  duration: '5s',
  engine: 'Seedance',
  quality: '720P',
});

const cost = computed(() => calcVideoCost(costInput.value));

function isEngine(value: unknown): value is VideoEngine {
  return value === 'Seedance' || value === 'Grok' || value === 'VEO';
}

function syncCostInput(values: Record<string, unknown>) {
  const next: CostInput = { ...costInput.value };
  if (isEngine(values.engine)) {
    next.engine = values.engine;
  }
  if (values.duration === '5s' || values.duration === '10s') {
    next.duration = values.duration;
  }
  if (values.quality === '720P' || values.quality === '1080P') {
    next.quality = values.quality;
  }
  costInput.value = next;
}

const [Form, formApi] = useVbenForm({
  handleSubmit() {
    message.success(`已生成（演示）消耗 ${cost.value} 算力点`);
  },
  handleValuesChange(values, fields) {
    syncCostInput(values);
    if (fields.includes('engine') && values.engine === 'VEO') {
      void formApi.setFieldValue('ratio', '16:9');
    }
  },
  layout: 'vertical',
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        class:
          'flex !w-full !flex-col gap-2 sm:!flex-row [&>label]:h-auto [&>label]:flex-1 [&>label]:whitespace-normal [&>label]:px-2 [&>label]:py-1.5 [&>label]:text-left',
      },
      defaultValue: 'Seedance',
      fieldName: 'engine',
      formItemClass: 'sm:col-span-3',
      label: '生成引擎',
      renderComponentContent: () => ({
        default: () =>
          engines.map((item) =>
            h(
              Radio.Button,
              {
                class:
                  'h-auto !flex-1 whitespace-normal px-2 py-1.5 text-left leading-tight',
                key: item.key,
                value: item.key,
              },
              {
                default: () => [
                  h('b', { class: 'block text-[12.5px]' }, item.title),
                  h(
                    'small',
                    { class: 'block text-[10.5px] font-normal opacity-80' },
                    item.sub,
                  ),
                ],
              },
            ),
          ),
      }),
      rules: 'selectRequired',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: 'Seedance 1.5 Pro', value: 'Seedance 1.5 Pro' },
          { label: 'Seedance 2.0 Fast', value: 'Seedance 2.0 Fast' },
          { label: 'Seedance 2.0', value: 'Seedance 2.0' },
        ],
      },
      defaultValue: 'Seedance 1.5 Pro',
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.engine === 'Seedance' ? 'selectRequired' : null,
          show: values.engine === 'Seedance',
        }),
        triggerFields: ['engine'],
      },
      description: '2.0 系列画质与运镜更强、算力消耗更高，请按需谨慎选择',
      fieldName: 'sdModel',
      formItemClass: 'sm:col-span-3',
      label: '模型版本',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          show:
            values.engine === 'Seedance' &&
            values.sdModel !== 'Seedance 1.5 Pro',
        }),
        triggerFields: ['engine', 'sdModel'],
      },
      fieldName: 'sdRefImage',
      formItemClass: 'sm:col-span-3',
      label: '参考图（可选 · 图生视频）',
      renderComponentContent: () => ({
        default: () => '🖼 上传参考图，让画面贴合你的产品',
      }),
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'video/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          show:
            values.engine === 'Seedance' &&
            values.sdModel !== 'Seedance 1.5 Pro',
        }),
        triggerFields: ['engine', 'sdModel'],
      },
      fieldName: 'sdRefVideo',
      formItemClass: 'sm:col-span-3',
      label: '参考视频（可选 · 动作参考）',
      renderComponentContent: () => ({
        default: () => '🎞 上传参考视频，生成画面将参考其运镜与动作',
      }),
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          show: values.engine === 'Grok',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'grokRefImage',
      formItemClass: 'sm:col-span-3',
      label: '参考图（可选 · 图生视频）',
      renderComponentContent: () => ({
        default: () => '🖼 上传参考图，让画面贴合你的产品',
      }),
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: [
          {
            label: '通道 1（默认 · 稳定）',
            value: '通道 1（默认 · 稳定）',
          },
          {
            label: '通道 2（高峰期备用）',
            value: '通道 2（高峰期备用）',
          },
          {
            label: '通道 3（极速 · 消耗略高）',
            value: '通道 3（极速 · 消耗略高）',
          },
        ],
      },
      defaultValue: '通道 1（默认 · 稳定）',
      dependencies: {
        resolve: ({ values }) => ({
          show: values.engine === 'Grok',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'channel',
      formItemClass: 'sm:col-span-3',
      label: '生成通道',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.engine === 'VEO' ? 'required' : null,
          show: values.engine === 'VEO',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'veoStart',
      label: '首帧',
      renderComponentContent: () => ({
        default: () => '🖼 第一张 点击上传',
      }),
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.engine === 'VEO' ? 'required' : null,
          show: values.engine === 'VEO',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'veoMid',
      label: '中间帧',
      renderComponentContent: () => ({
        default: () => '🖼 第二张 点击上传',
      }),
    },
    {
      component: 'Upload',
      componentProps: {
        accept: 'image/*',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.engine === 'VEO' ? 'required' : null,
          show: values.engine === 'VEO',
        }),
        triggerFields: ['engine'],
      },
      description:
        '三张图须比例一致，生成视频按首帧→中间帧→尾帧过渡；VEO 默认 16:9 横版输出',
      fieldName: 'veoEnd',
      label: '尾帧',
      renderComponentContent: () => ({
        default: () => '🖼 第三张 点击上传',
      }),
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder:
          '描述你想要的画面，如：城市夜景航拍，霓虹灯光流动，电影感镜头',
        rows: 4,
      },
      defaultValue: '城市夜景航拍，霓虹灯流动，电影感镜头缓慢推进',
      description: () =>
        h(
          'div',
          { class: 'mt-1.5 flex flex-wrap gap-1.5' },
          examplePrompts.map((text) =>
            h(
              'button',
              {
                class:
                  'cursor-pointer rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-[11px] text-[#6B7280] hover:border-[#0A0A0A] hover:text-[#0A0A0A]',
                key: text,
                onClick: () => formApi.setFieldValue('prompt', text),
                type: 'button',
              },
              text,
            ),
          ),
        ),
      fieldName: 'prompt',
      formItemClass: 'sm:col-span-3',
      label: '提示词',
      rules: z.string().min(1, { message: '请输入提示词' }),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: '5 秒', value: '5s' },
          { label: '10 秒', value: '10s' },
        ],
      },
      defaultValue: '5s',
      dependencies: {
        resolve: ({ values }) => ({
          if: values.engine !== 'VEO',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'duration',
      formItemClass: 'sm:col-span-3',
      label: '时长',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: '9:16', value: '9:16' },
          { label: '16:9', value: '16:9' },
          { label: '1:1', value: '1:1' },
        ],
      },
      defaultValue: '9:16',
      fieldName: 'ratio',
      formItemClass: 'sm:col-span-3',
      label: '画面比例',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: '720P', value: '720P' },
          { label: '1080P', value: '1080P' },
        ],
      },
      defaultValue: '720P',
      dependencies: {
        resolve: ({ values }) => ({
          if: values.engine !== 'VEO',
        }),
        triggerFields: ['engine'],
      },
      fieldName: 'quality',
      formItemClass: 'sm:col-span-3',
      label: '清晰度',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-3',
});

function openPreview(item: (typeof works)[number]) {
  previewModalRef.value?.modalApi.setData({
    color: item.color,
    duration: item.dur,
    extra: `引擎 / 模型：${item.engine}\n提示词：${item.title}\n状态：已完成 · 消耗 ${item.cost} 算力点 · 生成时间 ${item.time}`,
    ratio: `${item.ratio} · ${item.quality}`,
    title: item.title,
  });
  previewModalRef.value?.modalApi.open();
}
</script>

<template>
  <PageShell>
    <div
      class="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-3.5"
    >
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">视频生成</span>
            <Tag>消耗算力点</Tag>
          </div>
        </template>
        <Form />
        <div
          class="mt-3 rounded-md bg-[#F7F7F4] p-2.5 text-[12px] text-[#6B7280]"
        >
          ⚡ 预计消耗：<b class="text-[#0A0A0A]">{{ cost }}</b> 算力点 ·
          当前余额
          <b class="text-[#0A0A0A]">{{ points.toLocaleString('zh-CN') }}</b> 点
        </div>
        <Button
          :class="primaryBtnClass"
          block
          class="mt-3"
          size="large"
          type="primary"
          @click="formApi.validateAndSubmit()"
        >
          🎬 生成视频
        </Button>
      </Card>

      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">作品库</span>
            <Tag>共 {{ works.length }} 条</Tag>
          </div>
        </template>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="w in works"
            :key="w.id"
            class="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
          >
            <div
              class="relative grid aspect-video place-items-center text-[26px] text-white"
              :style="{ background: w.color }"
            >
              🎬
              <span
                class="absolute top-2 left-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10.5px] text-white"
                >{{ w.ratio }}</span>
              <span
                class="absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white"
                >{{ w.dur }}</span>
            </div>
            <div class="p-3">
              <div class="mb-1 truncate text-[12.5px] font-semibold">
                {{ w.title }}
              </div>
              <div class="text-[11px] text-[#6B7280]">
                {{ w.engine }} · {{ w.ratio }} · {{ w.dur }} · {{ w.time }}
              </div>
              <div class="mt-2 flex gap-2">
                <Button size="small" @click="openPreview(w)">预览</Button>
                <Button
                  size="small"
                  @click="message.success('已下载到本地（演示）')"
                >
                  下载
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <PreviewModal ref="previewModalRef" />
    </div>
  </PageShell>
</template>
