<script lang="ts" setup>
import type { PreviewMedia } from '../_shared/preview-modal.vue';

import { computed, ref } from 'vue';

import { Button, Card, message, Tag } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';

import {
  cardClass,
  pageGapClass,
  primaryBtnClass,
} from '../_shared/chic-classes';
import PreviewModal from '../_shared/preview-modal.vue';

type DhTab = 'avatar' | 'edit' | 'hifi' | 'lib' | 'tts';
type ModalExpose = {
  modalApi: {
    open: () => void;
    setData: (data: PreviewMedia) => void;
  };
};

const DEFAULT_TTS_TEXT =
  '家人们，这款家居好物真的太好用了，今天下单还有专属优惠，点击主页联系方式，安排专员一对一对接！';
const DEFAULT_EDIT_TEXT =
  '大家好，我是小雅。今天用 30 秒给大家讲清楚，我们的智能获客系统怎么帮你在评论区自动找客户……';

const genderOptions = [
  { label: '女', value: '女' },
  { label: '男', value: '男' },
];
const ratioOptions = [
  { label: '9:16 竖屏', value: '9:16' },
  { label: '16:9 横屏', value: '16:9' },
  { label: '1:1 方形', value: '1:1' },
];
const radioButtonProps = {
  buttonStyle: 'solid' as const,
  optionType: 'button' as const,
};

function mockUploadRequest(options: { onSuccess?: (body?: unknown) => void }) {
  options.onSuccess?.('ok');
}

const activeTab = ref<DhTab>('hifi');
const hifiMethod = ref<'online' | 'upload'>('online');
const ttsReady = ref(false);
const editTextLen = ref(DEFAULT_EDIT_TEXT.length);
const previewModalRef = ref<ModalExpose>();
const dhPoints = ref(1000);

interface Voice {
  gender: string;
  id: string;
  name: string;
  progress?: number;
  status: 'done' | 'training';
  tag: string;
}

const voices: Voice[] = [
  {
    id: 'v1',
    name: '知性女声 · 小雅',
    gender: '女',
    tag: '我的复刻',
    status: 'done',
  },
  {
    id: 'v2',
    name: '沉稳男声 · 阿哲',
    gender: '男',
    tag: '我的复刻',
    status: 'training',
    progress: 60,
  },
];

const cloneVoices: Voice[] = [
  {
    id: 'cv1',
    name: '活力女声 · 主播款',
    gender: '女',
    tag: '我的克隆',
    status: 'done',
  },
  {
    id: 'cv2',
    name: '温和男声 · 解说款',
    gender: '男',
    tag: '我的克隆',
    status: 'done',
  },
];

interface Avatar {
  emoji: string;
  id: string;
  name: string;
  own?: boolean;
  tag: string;
}

const avatarLib: Avatar[] = [
  { id: 'a1', name: '知性女主播', emoji: '👩‍💼', tag: '口播 · 竖屏' },
  { id: 'a2', name: '阳光男主播', emoji: '👨‍💼', tag: '口播 · 竖屏' },
  { id: 'a3', name: '甜美女生', emoji: '👩', tag: '生活 · 口播' },
  { id: 'a4', name: '潮流青年', emoji: '🧑‍🎤', tag: '潮流 · 口播' },
  { id: 'a5', name: '商务顾问', emoji: '🕴️', tag: '商务 · 口播' },
  { id: 'a6', name: '生活博主', emoji: '👩‍🌾', tag: '生活 · 口播' },
  { id: 'a7', name: '元气少女', emoji: '👧', tag: '元气 · 口播' },
  { id: 'a8', name: '知识分享官', emoji: '🧑‍🏫', tag: '知识 · 口播' },
];

const myAvatars: Avatar[] = [
  { id: 'ma1', name: '小雅数字分身', emoji: '💁‍♀️', tag: '我的定制', own: true },
];

const selectedAvatar = ref<string>('a1');

const videoLib = [
  {
    id: 'g1',
    title: '产品介绍 · 智能获客篇',
    ratio: '9:16',
    dur: '00:28',
    color: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
    meta: '小雅数字分身 · 知性女声（复刻）',
    cost: 50,
    time: '2026-08-28 15:20',
  },
  {
    id: 'g2',
    title: '家居好物种草 v1',
    ratio: '9:16',
    dur: '00:18',
    color: 'linear-gradient(135deg,#EC4899,#F43F5E)',
    meta: '小雅数字分身 · 活力女声（克隆）',
    cost: 50,
    time: '2026-08-27 11:08',
  },
  {
    id: 'g3',
    title: '品牌宣传 · 品牌故事',
    ratio: '16:9',
    dur: '00:42',
    color: 'linear-gradient(135deg,#06B6D4,#0EA5E9)',
    meta: '商务顾问（公共） · 磁性男声',
    cost: 50,
    time: '2026-08-26 10:05',
  },
  {
    id: 'g4',
    title: '新品发布预告',
    ratio: '9:16',
    dur: '00:15',
    color: 'linear-gradient(135deg,#F59E0B,#F97316)',
    meta: '知性女主播（公共） · 知性女声（复刻）',
    cost: 50,
    time: '2026-08-25 16:40',
  },
  {
    id: 'g5',
    title: '节日大促直播切片',
    ratio: '16:9',
    dur: '00:30',
    color: 'linear-gradient(135deg,#10B981,#06B6D4)',
    meta: '阳光男主播（公共） · 磁性男声',
    cost: 50,
    time: '2026-08-24 19:12',
  },
  {
    id: 'g6',
    title: '教程 · 智能获客 3 步',
    ratio: '9:16',
    dur: '00:35',
    color: 'linear-gradient(135deg,#3B82F6,#6366F1)',
    meta: '小雅数字分身 · 知性女声（复刻）',
    cost: 50,
    time: '2026-08-23 09:30',
  },
];

const tabs = [
  { key: 'hifi' as const, label: '声音复刻' },
  { key: 'tts' as const, label: '声音克隆' },
  { key: 'avatar' as const, label: '形象定制' },
  { key: 'edit' as const, label: '数字人精剪' },
  { key: 'lib' as const, label: '精剪视频库' },
];

const dhDurationHint = computed(() => {
  const seconds = Math.max(1, Math.round(editTextLen.value / 4));
  return `预计时长约 ${seconds} 秒（按每秒 4 字估算）`;
});

const [HifiForm, hifiFormApi] = useVbenForm({
  handleSubmit() {
    message.success('复刻训练 已提交（演示）');
  },
  handleValuesChange(values, fields) {
    if (
      fields.includes('method') &&
      (values.method === 'online' || values.method === 'upload')
    ) {
      hifiMethod.value = values.method;
    }
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '如：知性女声 · 小雅' },
      fieldName: 'name',
      label: '音色名称',
      rules: z.string().min(1, { message: '请输入音色名称' }),
    },
    {
      component: 'Select',
      componentProps: { class: 'w-full', options: genderOptions },
      defaultValue: '女',
      fieldName: 'gender',
      label: '性别',
      rules: 'selectRequired',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: '在线录制（推荐）', value: 'online' },
          { label: '上传音频', value: 'upload' },
        ],
      },
      defaultValue: 'online',
      fieldName: 'method',
      formItemClass: 'sm:col-span-2',
      label: '录制方式',
      rules: 'selectRequired',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.wav,.m4a,.mp3',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      dependencies: {
        resolve: ({ values }) => ({
          rules: values.method === 'upload' ? 'required' : null,
          show: values.method === 'upload',
        }),
        triggerFields: ['method'],
      },
      fieldName: 'file',
      formItemClass: 'sm:col-span-2',
      help: '⚠ 若格式不符请用剪辑软件重新导出，勿直接修改文件后缀名，否则音频损坏无法训练',
      label: '上传音频文件',
      renderComponentContent: () => ({
        default: () =>
          '📤 点击上传录音（支持 wav / m4a / mp3，中英日等多语种均可，建议 1-3 分钟）',
      }),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [CloneForm, cloneFormApi] = useVbenForm({
  handleSubmit() {
    message.success('克隆音色 已提交（演示）');
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '如：活力女声 · 主播款' },
      fieldName: 'name',
      label: '音色名称',
      rules: z.string().min(1, { message: '请输入音色名称' }),
    },
    {
      component: 'Select',
      componentProps: { class: 'w-full', options: genderOptions },
      defaultValue: '女',
      fieldName: 'gender',
      label: '性别',
      rules: 'selectRequired',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.mp3,audio/mpeg',
        customRequest: mockUploadRequest,
        maxCount: 1,
      },
      fieldName: 'file',
      formItemClass: 'sm:col-span-2',
      help: '仅 MP3',
      label: '上传音频（MP3）',
      renderComponentContent: () => ({
        default: () =>
          '📤 点击上传 MP3 录音（语速适中、情绪饱满，10 秒 - 3 分钟）',
      }),
      rules: 'required',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [TtsForm, ttsFormApi] = useVbenForm({
  handleSubmit() {
    ttsReady.value = true;
    message.success('已生成配音（演示）');
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: [
          { label: '知性女声 · 小雅', value: '知性女声 · 小雅' },
          { label: '活力女声', value: '活力女声' },
          { label: '磁性男声', value: '磁性男声' },
        ],
      },
      defaultValue: '知性女声 · 小雅',
      fieldName: 'voice',
      label: '选择音色',
      rules: 'selectRequired',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: [
          { label: '0.8x', value: '0.8' },
          { label: '1.0x', value: '1.0' },
          { label: '1.2x', value: '1.2' },
        ],
      },
      defaultValue: '1.0',
      fieldName: 'speed',
      label: '语速',
    },
    {
      component: 'Textarea',
      componentProps: { autoSize: { minRows: 4 } },
      defaultValue: DEFAULT_TTS_TEXT,
      fieldName: 'text',
      formItemClass: 'sm:col-span-2',
      label: '合成文案',
      rules: z.string().min(1, { message: '请输入合成文案' }),
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [AvatarForm, avatarFormApi] = useVbenForm({
  handleSubmit() {
    message.success('形象定制 已提交（演示）');
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Input',
      componentProps: { placeholder: '如：小雅数字分身' },
      fieldName: 'name',
      label: '形象名称',
      rules: z.string().min(1, { message: '请输入形象名称' }),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: ratioOptions,
      },
      defaultValue: '9:16',
      fieldName: 'ratio',
      label: '输出画面比例',
      rules: 'selectRequired',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.mp4,video/mp4',
        customRequest: mockUploadRequest,
        maxCount: 1,
        maxSize: 200,
      },
      fieldName: 'video',
      formItemClass: 'sm:col-span-2',
      help: '⚠ 上传视频的画面比例必须与输出比例一致（如输出 9:16，视频也须为 9:16），否则无法训练',
      label: '上传形象视频（MP4）',
      renderComponentContent: () => ({
        default: () =>
          '📹 点击上传 MP4 口播视频（≤200MB，15-60 秒，建议 1080P 且不超过 2K）',
      }),
      rules: 'required',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'beauty',
      formItemClass: 'sm:col-span-2',
      label: '开启美颜（训练时对形象做磨皮 / 提亮处理）',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

const [EditForm, editFormApi] = useVbenForm({
  handleSubmit() {
    message.success('数字人视频 已提交（演示）');
  },
  handleValuesChange(values, fields) {
    if (fields.includes('text') && typeof values.text === 'string') {
      editTextLen.value = values.text.length;
    }
  },
  layout: 'vertical',
  schema: [
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: [
          { label: '小雅数字分身（我的）', value: '小雅数字分身（我的）' },
          { label: '知性女主播（公共）', value: '知性女主播（公共）' },
          { label: '阳光男主播（公共）', value: '阳光男主播（公共）' },
          { label: '商务顾问（公共）', value: '商务顾问（公共）' },
        ],
      },
      defaultValue: '小雅数字分身（我的）',
      fieldName: 'avatar',
      label: '选择形象',
      rules: 'selectRequired',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        options: [
          {
            label: '知性女声（小雅 · 复刻）',
            value: '知性女声（小雅 · 复刻）',
          },
          { label: '活力女声（公共）', value: '活力女声（公共）' },
          { label: '磁性男声（公共）', value: '磁性男声（公共）' },
        ],
      },
      defaultValue: '知性女声（小雅 · 复刻）',
      fieldName: 'voice',
      label: '选择声音',
      rules: 'selectRequired',
    },
    {
      component: 'Textarea',
      componentProps: { autoSize: { minRows: 4 } },
      defaultValue: DEFAULT_EDIT_TEXT,
      fieldName: 'text',
      formItemClass: 'sm:col-span-2',
      label: '口播文案',
      rules: z.string().min(1, { message: '请输入口播文案' }),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        ...radioButtonProps,
        options: ratioOptions,
      },
      defaultValue: '9:16',
      fieldName: 'ratio',
      label: '画面比例',
    },
    {
      component: 'CheckboxGroup',
      componentProps: {
        options: [
          { label: '简约办公室', value: '简约办公室' },
          { label: '绿幕抠像', value: '绿幕抠像' },
          { label: '自定义图片', value: '自定义图片' },
          { label: '自动字幕', value: '自动字幕' },
        ],
      },
      defaultValue: ['简约办公室', '自动字幕'],
      fieldName: 'extras',
      label: '背景与字幕',
    },
  ],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 sm:grid-cols-2',
});

function pickAvatar(id: string) {
  selectedAvatar.value = id;
}

function openPreview(item: (typeof videoLib)[number]) {
  previewModalRef.value?.modalApi.setData({
    color: item.color,
    duration: item.dur,
    extra: `形象 / 音色：${item.meta}\n状态：已完成 · 消耗 ${item.cost} 算力点 · 生成时间 ${item.time}`,
    ratio: item.ratio,
    title: item.title,
  });
  previewModalRef.value?.modalApi.open();
}
</script>

<template>
  <div :class="pageGapClass">
    <div
      class="flex flex-wrap items-center gap-1 rounded-[10px] border border-[#D8D7D0] bg-[#F9F9F6] p-1"
    >
      <button
        v-for="t in tabs"
        :key="t.key"
        class="cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] transition-all"
        :class="
          activeTab === t.key
            ? 'bg-[#0A0A0A] font-semibold text-white'
            : 'text-[#6B7280] hover:bg-white'
        "
        type="button"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 声音复刻 -->
    <div v-if="activeTab === 'hifi'" class="flex flex-col gap-3.5">
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">我的复刻音色</span>
            <Tag>一次性消耗 100 算力点 / 条</Tag>
          </div>
        </template>
        <ul class="m-0 list-none p-0">
          <li
            v-for="v in voices"
            :key="v.id"
            class="flex flex-wrap items-center gap-2.5 border-b border-dashed border-[#E5E7EB] py-2.5 last:border-b-0"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-full bg-[#F0F0EC] text-[14px]"
              >🎙</span>
            <div class="flex-1">
              <div class="text-[12.5px] font-semibold">{{ v.name }}</div>
              <div class="text-[11px] text-[#6B7280]">
                {{ v.gender }} · {{ v.tag }}
              </div>
            </div>
            <Tag v-if="v.status === 'done'" color="success">已完成</Tag>
            <Tag v-else>训练中 {{ v.progress }}%</Tag>
            <Button size="small">试听</Button>
          </li>
        </ul>
      </Card>

      <Card :bordered="false" :class="cardClass" title="新建声音复刻（高保真）">
        <HifiForm />
        <div v-if="hifiMethod === 'online'" class="mt-1 flex flex-col gap-1">
          <label class="text-[12px] font-medium">朗读文本（跟读 10 句，约 3
            分钟，请在安静环境用正常语速朗读）</label>
          <div
            class="rounded-md bg-[#F7F7F4] p-3 text-[12px] leading-[1.9] text-[#6B7280]"
          >
            1. 大家好，欢迎来到我的频道。<br />
            2. 今天给大家分享一个实用的好方法。<br />
            3. 这款产品的特点非常明显。<br />
            ……（共 10 句，点击开始录制后逐句跟读）
          </div>
        </div>
        <div
          class="mt-3 rounded-md bg-[#F7F7F4] p-2.5 text-[12px] text-[#6B7280]"
        >
          🎧 高保真复刻：<b class="text-[#0A0A0A]">100 算力点</b>（一次性）·
          训练约 30 分钟 · 完成后可在「声音克隆」「数字人精剪」中使用
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            :class="primaryBtnClass"
            type="primary"
            @click="hifiFormApi.validateAndSubmit()"
          >
            🎙 提交复刻训练
          </Button>
          <Button @click="message.success('已保存草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 声音克隆 -->
    <div v-if="activeTab === 'tts'" class="flex flex-col gap-3.5">
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">我的克隆音色</span>
            <Tag>试听消耗算力点</Tag>
          </div>
        </template>
        <ul class="m-0 list-none p-0">
          <li
            v-for="v in cloneVoices"
            :key="v.id"
            class="flex flex-wrap items-center gap-2.5 border-b border-dashed border-[#E5E7EB] py-2.5 last:border-b-0"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-full bg-[#F0F0EC] text-[14px]"
              >🎙</span>
            <div class="flex-1">
              <div class="text-[12.5px] font-semibold">{{ v.name }}</div>
              <div class="text-[11px] text-[#6B7280]">
                {{ v.gender }} · {{ v.tag }}
              </div>
            </div>
            <Button size="small">试听</Button>
          </li>
        </ul>
      </Card>

      <Card :bordered="false" :class="cardClass" title="新建克隆音色">
        <CloneForm />
        <div class="mt-3">
          <Button
            :class="primaryBtnClass"
            type="primary"
            @click="cloneFormApi.validateAndSubmit()"
          >
            🎙 提交克隆
          </Button>
        </div>
      </Card>

      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">文本转语音（声音克隆）</span>
            <Tag>5 算力点 / 百字</Tag>
          </div>
        </template>
        <TtsForm />
        <div
          class="mt-3 rounded-md bg-[#F7F7F4] p-2.5 text-[12px] text-[#6B7280]"
        >
          🔊 预计消耗：<b class="text-[#0A0A0A]">5 算力点</b> · 预计时长 15 秒 ·
          支持导出 MP3 用于数字人精剪
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            :class="primaryBtnClass"
            type="primary"
            @click="ttsFormApi.validateAndSubmit()"
          >
            🔊 生成配音
          </Button>
          <Button @click="message.success('已插入到数字人精剪文案中')">
            直接用于精剪文案
          </Button>
        </div>
        <div
          v-if="ttsReady"
          class="mt-3 flex items-center gap-3 rounded-[14px] border border-[#DCDAD4] bg-[#F7F7F4] p-3"
        >
          <Button shape="circle" @click="message.success('试听中…（演示）')">
            ▶
          </Button>
          <span class="text-[12px] text-[#6B7280]">配音_知性女声_15s.mp3 · 已生成</span>
        </div>
      </Card>
    </div>

    <!-- 形象定制 -->
    <div v-if="activeTab === 'avatar'" class="flex flex-col gap-3.5">
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">公共形象库</span>
            <Tag color="success">免费使用</Tag>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="a in avatarLib"
            :key="a.id"
            class="cursor-pointer rounded-[14px] border-2 p-3 text-center transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
            :class="
              selectedAvatar === a.id
                ? 'border-[#0A0A0A] bg-[#F0F0EC]'
                : 'border-[#E5E7EB] bg-white'
            "
            @click="pickAvatar(a.id)"
          >
            <div
              class="mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-br from-[#F0F0EC] to-[#E8E8E2] text-[24px]"
            >
              {{ a.emoji }}
            </div>
            <div class="text-[12.5px] font-semibold">{{ a.name }}</div>
            <div class="mt-[2px] text-[10.5px] text-[#6B7280]">{{ a.tag }}</div>
            <div
              v-if="selectedAvatar === a.id"
              class="mt-1.5 inline-flex text-[10.5px] font-semibold text-[#0A0A0A]"
            >
              ✓ 已选择
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">我的形象</span>
            <Tag>定制 200 算力点 / 个（一次性）</Tag>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="a in myAvatars"
            :key="a.id"
            class="rounded-[14px] border-2 border-[#0A0A0A] bg-[#F0F0EC] p-3 text-center"
          >
            <div
              class="mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-br from-[#F0F0EC] to-[#E8E8E2] text-[24px]"
            >
              {{ a.emoji }}
            </div>
            <div class="text-[12.5px] font-semibold">{{ a.name }}</div>
            <div class="mt-[2px] text-[10.5px] text-[#6B7280]">{{ a.tag }}</div>
            <div
              class="mt-1.5 inline-flex text-[10.5px] font-semibold text-[#0A0A0A]"
            >
              ✓ 已选择
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" :class="cardClass" title="新建形象定制">
        <AvatarForm />
        <details
          class="mt-1 rounded-md border border-dashed border-[#E5E7EB] bg-[#F7F7F4] p-2.5 text-[11.5px] text-[#6B7280]"
        >
          <summary
            class="cursor-pointer text-[12px] font-semibold text-[#111827]"
          >
            拍摄要求（展开查看，未达标将导致嘴型不同步或训练失败）
          </summary>
          <div class="mt-2 space-y-1 leading-relaxed">
            <div>✓ 声音与嘴型同步，普通话清晰</div>
            <div>✓ 脸部清晰，人脸占画面 ≥ 1/4</div>
            <div>✓ 单人、正面出镜，不要多人或侧脸</div>
            <div>✓ 光线均衡，避免逆光和过暗环境</div>
            <div>✓ 避免绿色、浅色、反光材质服装（影响抠像）</div>
            <div>✓ 不戴眼镜，减少面部遮挡</div>
            <div>✓ 一镜到底，不切换场景、不加转场和字幕</div>
          </div>
        </details>
        <div
          class="mt-3 rounded-md bg-[#F7F7F4] p-2.5 text-[12px] text-[#6B7280]"
        >
          🧑‍💼 形象定制：<b class="text-[#0A0A0A]">200 算力点</b>（一次性）·
          训练约 2 小时 · 完成后可用于数字人精剪
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            :class="primaryBtnClass"
            type="primary"
            @click="avatarFormApi.validateAndSubmit()"
          >
            ✨ 提交定制训练
          </Button>
          <Button @click="message.success('已保存草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 数字人精剪 -->
    <div v-if="activeTab === 'edit'" class="flex flex-col gap-3.5">
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">数字人视频合成</span>
            <Tag>50 算力点 / 条</Tag>
          </div>
        </template>
        <EditForm />
        <span class="mt-1 block text-[11px] text-[#6B7280]">{{
          dhDurationHint
        }}</span>
        <div
          class="mt-3 rounded-md bg-[#F7F7F4] p-2.5 text-[12px] text-[#6B7280]"
        >
          🎬 本次合成：<b class="text-[#0A0A0A]">50 算力点</b> · 当前余额
          <b class="text-[#0A0A0A]">{{ dhPoints }}</b> 点 ·
          完成后自动进入「精剪视频库」
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <Button
            :class="primaryBtnClass"
            type="primary"
            @click="editFormApi.validateAndSubmit()"
          >
            🎬 生成数字人视频
          </Button>
          <Button @click="message.success('已保存为草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 精剪库 -->
    <div v-if="activeTab === 'lib'">
      <Card :bordered="false" :class="cardClass">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">精剪视频库</span>
            <Button
              size="small"
              @click="message.success('已全部下载到本地（演示）')"
            >
              全部下载
            </Button>
          </div>
        </template>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="g in videoLib"
            :key="g.id"
            class="overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]"
          >
            <div
              class="relative grid aspect-video place-items-center text-[26px] text-white"
              :style="{ background: g.color }"
            >
              🎬
              <span
                class="absolute top-2 left-2 rounded-md bg-black/40 px-1.5 py-0.5 text-[10.5px] text-white"
                >{{ g.ratio }}</span>
              <span
                class="absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10.5px] text-white"
                >{{ g.dur }}</span>
            </div>
            <div class="p-2.5">
              <div class="mb-1 truncate text-[12.5px] font-semibold">
                {{ g.title }}
              </div>
              <div class="text-[11px] leading-relaxed text-[#6B7280]">
                {{ g.ratio }} · {{ g.dur }} · 数字人精剪
              </div>
            </div>
            <div class="flex gap-2 px-3 pb-2.5">
              <Button size="small" @click="openPreview(g)">预览</Button>
              <Button
                size="small"
                @click="message.success('已下载到本地（演示）')"
              >
                下载
              </Button>
              <Button
                size="small"
                danger
                @click="message.success(`已删除《${g.title}》`)"
              >
                删除
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <PreviewModal ref="previewModalRef" />
  </div>
</template>
