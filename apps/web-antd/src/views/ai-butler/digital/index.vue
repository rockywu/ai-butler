<script lang="ts" setup>
import { computed, ref } from 'vue';

import {
  Button,
  Card,
  Input,
  message,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

type DhTab = 'avatar' | 'edit' | 'hifi' | 'lib' | 'tts';

const activeTab = ref<DhTab>('hifi');

interface Voice {
  id: string;
  name: string;
  gender: string;
  tag: string;
  status: 'done' | 'training';
  progress?: number;
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
  id: string;
  name: string;
  emoji: string;
  tag: string;
  own?: boolean;
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
const hifiName = ref('');
const hifiGender = ref('女');
const hifiMethod = ref<'online' | 'upload'>('online');

const ttsVoice = ref('知性女声 · 小雅');
const ttsSpeed = ref('1.0');
const ttsText = ref(
  '家人们，这款家居好物真的太好用了，今天下单还有专属优惠，点击主页联系方式，安排专员一对一对接！',
);

const avatarName = ref('');
const avatarRatio = ref('9:16');
const avatarBeauty = ref(true);

const editAvatar = ref('小雅数字分身（我的）');
const editVoice = ref('知性女声（小雅 · 复刻）');
const editText = ref(
  '大家好，我是小雅。今天用 30 秒给大家讲清楚，我们的智能获客系统怎么帮你在评论区自动找客户……',
);
const editRatio = ref('9:16');

const videoLib = [
  {
    id: 'g1',
    title: '产品介绍 · 智能获客篇',
    ratio: '9:16',
    dur: '00:28',
    color: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
  },
  {
    id: 'g2',
    title: '家居好物种草 v1',
    ratio: '9:16',
    dur: '00:18',
    color: 'linear-gradient(135deg,#EC4899,#F43F5E)',
  },
  {
    id: 'g3',
    title: '品牌宣传 · 品牌故事',
    ratio: '16:9',
    dur: '00:42',
    color: 'linear-gradient(135deg,#06B6D4,#0EA5E9)',
  },
  {
    id: 'g4',
    title: '新品发布预告',
    ratio: '9:16',
    dur: '00:15',
    color: 'linear-gradient(135deg,#F59E0B,#F97316)',
  },
  {
    id: 'g5',
    title: '节日大促直播切片',
    ratio: '16:9',
    dur: '00:30',
    color: 'linear-gradient(135deg,#10B981,#06B6D4)',
  },
  {
    id: 'g6',
    title: '教程 · 智能获客 3 步',
    ratio: '9:16',
    dur: '00:35',
    color: 'linear-gradient(135deg,#3B82F6,#6366F1)',
  },
];

const dhPoints = ref(1000);

const tabs = [
  { key: 'hifi' as const, label: '声音复刻' },
  { key: 'tts' as const, label: '声音克隆' },
  { key: 'avatar' as const, label: '形象定制' },
  { key: 'edit' as const, label: '数字人精剪' },
  { key: 'lib' as const, label: '精剪视频库' },
];

const dhDurationHint = computed(() => {
  const seconds = Math.max(1, Math.round(editText.value.length / 4));
  return `预计时长约 ${seconds} 秒（按每秒 4 字估算）`;
});

function pickHifiMethod(key: 'online' | 'upload') {
  hifiMethod.value = key;
}
function pickRatio(key: string) {
  avatarRatio.value = key;
}
function pickEditRatio(key: string) {
  editRatio.value = key;
}
function pickTtsSpeed(key: string) {
  ttsSpeed.value = key;
}
function pickAvatar(id: string) {
  selectedAvatar.value = id;
}
function submit(name: string) {
  message.success(`${name} 已提交（演示）`);
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:gap-3.5">
    <div
      class="flex flex-wrap items-center gap-1 rounded-[10px] border border-[#E5E7EB] bg-white p-1"
    >
      <button
        v-for="t in tabs"
        :key="t.key"
        class="cursor-pointer rounded-lg px-3.5 py-1.5 text-[12.5px] transition-all"
        :class="
          activeTab === t.key
            ? '!bg-[#4B3FE3] !text-white font-semibold'
            : 'text-[#6B7280] hover:bg-[#F9FAFB]'
        "
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- 声音复刻 -->
    <div v-if="activeTab === 'hifi'" class="flex flex-col gap-3.5">
      <Card :bordered="false" class="!rounded-[14px]">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">我的复刻音色</span>
            <Tag color="processing">一次性消耗 100 算力点 / 条</Tag>
          </div>
        </template>
        <ul class="m-0 list-none p-0">
          <li
            v-for="v in voices"
            :key="v.id"
            class="flex flex-wrap items-center gap-2.5 border-b border-dashed border-[#E5E7EB] py-2.5 last:border-b-0"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-full bg-[#EDEEFE] text-[14px]"
              >🎙</span>
            <div class="flex-1">
              <div class="text-[12.5px] font-semibold">{{ v.name }}</div>
              <div class="text-[11px] text-[#6B7280]">
                {{ v.gender }} · {{ v.tag }}
              </div>
            </div>
            <Tag v-if="v.status === 'done'" color="success">已完成</Tag>
            <Tag v-else color="processing">训练中 {{ v.progress }}%</Tag>
            <Button size="small">试听</Button>
          </li>
        </ul>
      </Card>

      <Card
        :bordered="false"
        class="!rounded-[14px]"
        title="新建声音复刻（高保真）"
      >
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>音色名称</label>
            <Input v-model:value="hifiName" placeholder="如：知性女声 · 小雅" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>性别</label>
            <Select
              v-model:value="hifiGender"
              :options="[
                { label: '女', value: '女' },
                { label: '男', value: '男' },
              ]"
            />
          </div>
          <div class="col-span-1 flex flex-col gap-2 sm:col-span-2">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>录制方式</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="m in [
                  { k: 'online', t: '在线录制（推荐）' },
                  { k: 'upload', t: '上传音频' },
                ]"
                :key="m.k"
                class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px] transition-all"
                :class="
                  hifiMethod === m.k
                    ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                "
                @click="pickHifiMethod(m.k as 'online' | 'upload')"
              >
                {{ m.t }}
              </button>
            </div>
          </div>
          <div
            v-if="hifiMethod === 'online'"
            class="col-span-1 flex flex-col gap-1 sm:col-span-2"
          >
            <label class="text-[12px] font-medium">朗读文本（跟读 10 句，约 3
              分钟，请在安静环境用正常语速朗读）</label>
            <div
              class="rounded-md bg-[#F9FAFB] p-3 text-[12px] leading-[1.9] text-[#6B7280]"
            >
              1. 大家好，欢迎来到我的频道。<br />
              2. 今天给大家分享一个实用的好方法。<br />
              3. 这款产品的特点非常明显。<br />
              ……（共 10 句，点击开始录制后逐句跟读）
            </div>
          </div>
          <div v-else class="col-span-1 flex flex-col gap-1 sm:col-span-2">
            <label class="text-[12px] font-medium">上传音频文件</label>
            <div
              class="cursor-pointer rounded-md border-2 border-dashed border-[#D1D5DB] p-3 text-center text-[11.5px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
            >
              📤 点击上传录音（支持 wav / m4a / mp3）
            </div>
            <span class="text-[11px] text-[#6B7280]">⚠ 若格式不符请用剪辑软件重新导出，勿直接修改文件后缀名</span>
          </div>
          <div
            class="col-span-1 rounded-md bg-[#F9FAFB] p-2.5 text-[12px] text-[#6B7280] sm:col-span-2"
          >
            🎧 高保真复刻：<b class="text-[#4B3FE3]">100 算力点</b>（一次性）·
            训练约 30 分钟
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button type="primary" @click="submit('复刻训练')">
            🎙 提交复刻训练
          </Button>
          <Button @click="message.success('已保存草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 声音克隆 -->
    <div v-if="activeTab === 'tts'" class="flex flex-col gap-3.5">
      <Card :bordered="false" class="!rounded-[14px]" title="我的克隆音色">
        <ul class="m-0 list-none p-0">
          <li
            v-for="v in cloneVoices"
            :key="v.id"
            class="flex flex-wrap items-center gap-2.5 border-b border-dashed border-[#E5E7EB] py-2.5 last:border-b-0"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-full bg-[#EDEEFE] text-[14px]"
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

      <Card
        :bordered="false"
        class="!rounded-[14px]"
        title="文本转语音（声音克隆）"
      >
        <template #extra>
          <Tag color="processing">5 算力点 / 百字</Tag>
        </template>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>选择音色</label>
            <Select
              v-model:value="ttsVoice"
              :options="[
                { label: '知性女声 · 小雅', value: '知性女声 · 小雅' },
                { label: '活力女声', value: '活力女声' },
                { label: '磁性男声', value: '磁性男声' },
              ]"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium">语速</label>
            <div class="flex gap-2">
              <button
                v-for="s in ['0.8x', '1.0x', '1.2x']"
                :key="s"
                class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
                :class="
                  ttsSpeed === s
                    ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                "
                @click="pickTtsSpeed(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>
          <div class="col-span-1 flex flex-col gap-1 sm:col-span-2">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>合成文案</label>
            <Input.TextArea
              v-model:value="ttsText"
              :auto-size="{ minRows: 4 }"
            />
          </div>
          <div
            class="col-span-1 rounded-md bg-[#F9FAFB] p-2.5 text-[12px] text-[#6B7280] sm:col-span-2"
          >
            🔊 预计消耗：<b class="text-[#4B3FE3]">5 算力点</b> · 预计时长 15 秒
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button type="primary" @click="message.success('已生成配音（演示）')">
            🔊 生成配音
          </Button>
          <Button @click="message.success('已插入到数字人精剪文案中')">
            直接用于精剪文案
          </Button>
        </div>
      </Card>
    </div>

    <!-- 形象定制 -->
    <div v-if="activeTab === 'avatar'" class="flex flex-col gap-3.5">
      <Card :bordered="false" class="!rounded-[14px]">
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
                ? 'border-[#4B3FE3] bg-[#EDEEFE]'
                : 'border-[#E5E7EB] bg-white'
            "
            @click="pickAvatar(a.id)"
          >
            <div
              class="mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[24px]"
            >
              {{ a.emoji }}
            </div>
            <div class="text-[12.5px] font-semibold">{{ a.name }}</div>
            <div class="mt-[2px] text-[10.5px] text-[#6B7280]">{{ a.tag }}</div>
            <div
              v-if="selectedAvatar === a.id"
              class="mt-1.5 inline-flex text-[10.5px] font-semibold text-[#4B3FE3]"
            >
              ✓ 已选择
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="!rounded-[14px]">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">我的形象</span>
            <Tag color="processing">定制 200 算力点 / 个（一次性）</Tag>
          </div>
        </template>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <div
            v-for="a in myAvatars"
            :key="a.id"
            class="rounded-[14px] border-2 border-[#4B3FE3] bg-[#EDEEFE] p-3 text-center"
          >
            <div
              class="mx-auto mb-2 grid h-[52px] w-[52px] place-items-center rounded-full bg-gradient-to-br from-[#EDE9FE] to-[#DBEAFE] text-[24px]"
            >
              {{ a.emoji }}
            </div>
            <div class="text-[12.5px] font-semibold">{{ a.name }}</div>
            <div class="mt-[2px] text-[10.5px] text-[#6B7280]">{{ a.tag }}</div>
            <div
              class="mt-1.5 inline-flex text-[10.5px] font-semibold text-[#4B3FE3]"
            >
              ✓ 已选择
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="!rounded-[14px]" title="新建形象定制">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>形象名称</label>
            <Input v-model:value="avatarName" placeholder="如：小雅数字分身" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>输出画面比例</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in ['9:16 竖屏', '16:9 横屏', '1:1 方形']"
                :key="r"
                class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
                :class="
                  avatarRatio === r
                    ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                "
                @click="pickRatio(r)"
              >
                {{ r }}
              </button>
            </div>
          </div>
          <div class="col-span-1 flex flex-col gap-1 sm:col-span-2">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>上传形象视频（MP4）</label>
            <div
              class="cursor-pointer rounded-md border-2 border-dashed border-[#D1D5DB] p-3 text-center text-[11.5px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
            >
              📹 点击上传 MP4 口播视频（≤200MB，15-60 秒，建议 1080P 且不超过
              2K）
            </div>
            <span class="text-[11px] text-[#6B7280]">⚠ 上传视频的画面比例必须与输出比例一致</span>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <details
              class="rounded-md border border-dashed border-[#E5E7EB] bg-[#F9FAFB] p-2.5 text-[11.5px] text-[#6B7280]"
            >
              <summary
                class="cursor-pointer text-[12px] font-semibold text-[#111827]"
              >
                拍摄要求（展开查看）
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
          </div>
          <div
            class="col-span-1 flex items-center gap-2 text-[11.5px] text-[#6B7280] sm:col-span-2"
          >
            <span>开启美颜（训练时对形象做磨皮 / 提亮处理）</span>
            <Switch v-model:checked="avatarBeauty" />
          </div>
          <div
            class="col-span-1 rounded-md bg-[#F9FAFB] p-2.5 text-[12px] text-[#6B7280] sm:col-span-2"
          >
            🧑‍💼 形象定制：<b class="text-[#4B3FE3]">200 算力点</b>（一次性）·
            训练约 2 小时
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button type="primary" @click="submit('形象定制')">
            ✨ 提交定制训练
          </Button>
          <Button @click="message.success('已保存草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 数字人精剪 -->
    <div v-if="activeTab === 'edit'" class="flex flex-col gap-3.5">
      <Card :bordered="false" class="!rounded-[14px]">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">数字人视频合成</span>
            <Tag color="processing">50 算力点 / 条</Tag>
          </div>
        </template>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>选择形象</label>
            <Select
              v-model:value="editAvatar"
              :options="[
                {
                  label: '小雅数字分身（我的）',
                  value: '小雅数字分身（我的）',
                },
                { label: '知性女主播（公共）', value: '知性女主播（公共）' },
                { label: '阳光男主播（公共）', value: '阳光男主播（公共）' },
                { label: '商务顾问（公共）', value: '商务顾问（公共）' },
              ]"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>选择声音</label>
            <Select
              v-model:value="editVoice"
              :options="[
                {
                  label: '知性女声（小雅 · 复刻）',
                  value: '知性女声（小雅 · 复刻）',
                },
                { label: '活力女声（公共）', value: '活力女声（公共）' },
                { label: '磁性男声（公共）', value: '磁性男声（公共）' },
              ]"
            />
          </div>
          <div class="col-span-1 flex flex-col gap-1 sm:col-span-2">
            <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>口播文案</label>
            <Input.TextArea
              v-model:value="editText"
              :auto-size="{ minRows: 4 }"
            />
            <span class="text-[11px] text-[#6B7280]">{{ dhDurationHint }}</span>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium">画面比例</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in ['9:16', '16:9', '1:1']"
                :key="r"
                class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
                :class="
                  editRatio === r
                    ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                    : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
                "
                @click="pickEditRatio(r)"
              >
                {{ r }}
              </button>
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-[12px] font-medium">背景与字幕</label>
            <div class="flex flex-wrap gap-2">
              <button
                class="cursor-pointer rounded-full border border-[#4B3FE3] bg-[#EDEEFE] px-3 py-1.5 text-[12px] font-semibold text-[#4B3FE3]"
              >
                简约办公室
              </button>
              <button
                class="cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] text-[#6B7280]"
              >
                绿幕抠像
              </button>
              <button
                class="cursor-pointer rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] text-[#6B7280]"
              >
                自定义图片
              </button>
              <button
                class="cursor-pointer rounded-full border border-[#4B3FE3] bg-[#EDEEFE] px-3 py-1.5 text-[12px] font-semibold text-[#4B3FE3]"
              >
                自动字幕
              </button>
            </div>
          </div>
          <div
            class="col-span-1 rounded-md bg-[#F9FAFB] p-2.5 text-[12px] text-[#6B7280] sm:col-span-2"
          >
            🎬 本次合成：<b class="text-[#4B3FE3]">50 算力点</b> · 当前余额
            <b class="text-[#4B3FE3]">{{ dhPoints }}</b> 点
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <Button type="primary" @click="submit('数字人视频')">
            🎬 生成数字人视频
          </Button>
          <Button @click="message.success('已保存为草稿')">保存草稿</Button>
        </div>
      </Card>
    </div>

    <!-- 精剪库 -->
    <div v-if="activeTab === 'lib'">
      <Card :bordered="false" class="!rounded-[14px]">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-1">
            <span class="text-[13px] font-semibold">精剪视频库</span>
            <Button size="small">全部下载</Button>
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
                9:16 · {{ g.dur }} · 数字人精剪
              </div>
            </div>
            <div class="flex gap-2 px-3 pb-2.5">
              <Button size="small">预览</Button>
              <Button size="small">下载</Button>
              <Button size="small" danger>删除</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
