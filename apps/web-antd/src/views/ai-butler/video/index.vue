<script lang="ts" setup>
import { computed, ref } from 'vue';

import { Button, Card, Input, message, Select, Tag } from 'ant-design-vue';

type Engine = 'Grok' | 'Seedance' | 'VEO';

const engine = ref<Engine>('Seedance');
const sdModel = ref('Seedance 1.5 Pro');
const prompt = ref('城市夜景航拍，霓虹灯流动，电影感镜头缓慢推进');
const duration = ref('5s');
const ratio = ref('9:16');
const quality = ref('720P');
const grokChannel = ref('通道 1（默认 · 稳定）');
const veoImgs = ref<[boolean, boolean, boolean]>([false, false, false]);

const works = [
  {
    id: 'w1',
    title: '城市夜景航拍',
    engine: 'Seedance',
    dur: '5s',
    ratio: '9:16',
    time: '今天 11:20',
    color: 'linear-gradient(135deg,#1E1B4B,#7C3AED)',
  },
  {
    id: 'w2',
    title: '家居产品旋转展示',
    engine: 'Grok',
    dur: '10s',
    ratio: '1:1',
    time: '昨天 18:22',
    color: 'linear-gradient(135deg,#EC4899,#F43F5E)',
  },
];

const engines: { key: Engine; sub: string; title: string }[] = [
  { key: 'Seedance', title: 'Seedance', sub: '画面细腻 · 适合品牌宣传' },
  { key: 'Grok', title: 'Grok Imagine', sub: '创意脑洞 · 适合流量内容' },
  { key: 'VEO', title: 'VEO', sub: '三图生成 · 动作连贯' },
];

const sdModels = ['Seedance 1.5 Pro', 'Seedance 2.0 Fast', 'Seedance 2.0'];
const durations = ['5s', '10s'];
const ratios = ['9:16', '16:9', '1:1'];
const qualities = ['720P', '1080P'];
const examplePrompts = [
  '阳光穿过森林，镜头缓慢推进',
  '产品特写旋转展示，棚拍质感',
  '美食制作过程，热气腾腾，俯拍',
];

const showSdRef = computed(
  () => engine.value === 'Seedance' && sdModel.value !== 'Seedance 1.5 Pro',
);
const showQuality = computed(() => engine.value !== 'VEO');
const points = ref(1000);

const cost = computed(() => {
  let c = 10;
  if (engine.value === 'Grok') c += 5;
  if (engine.value === 'VEO') c += 8;
  if (duration.value === '10s') c += 5;
  if (quality.value === '1080P') c += 5;
  return c;
});

function pickEngine(key: Engine) {
  engine.value = key;
}
function pickSdModel(m: string) {
  sdModel.value = m;
}
function pickDuration(d: string) {
  duration.value = d;
}
function pickRatio(r: string) {
  ratio.value = r;
}
function pickQuality(q: string) {
  quality.value = q;
}
function fillExample(text: string) {
  prompt.value = text;
}
function toggleVeoImg(idx: number) {
  veoImgs.value[idx] = !veoImgs.value[idx];
}
function generate() {
  message.loading({ content: '正在生成视频…', duration: 0.8 });
  setTimeout(
    () => message.success(`已生成（演示）消耗 ${cost.value} 算力点`),
    800,
  );
}
</script>

<template>
  <div
    class="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-3.5"
  >
    <!-- 左侧：生成配置 -->
    <Card :bordered="false" class="!rounded-[14px]">
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-1">
          <span class="text-[13px] font-semibold">视频生成</span>
          <Tag color="processing">消耗算力点</Tag>
        </div>
      </template>
      <div class="flex flex-col gap-3 sm:gap-3.5">
        <div>
          <label class="mb-1.5 block text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>生成引擎</label>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              v-for="e in engines"
              :key="e.key"
              class="cursor-pointer rounded-[10px] border-2 p-2 text-left transition-all"
              :class="
                engine === e.key
                  ? 'border-[#4B3FE3] bg-[#EDEEFE]'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
              "
              @click="pickEngine(e.key)"
            >
              <b
                class="block text-[12.5px]"
                :class="engine === e.key ? 'text-[#4B3FE3]' : 'text-[#111827]'"
                >{{ e.title }}</b>
              <small class="text-[10.5px] text-[#6B7280]">{{ e.sub }}</small>
            </button>
          </div>
        </div>

        <!-- Seedance 专属 -->
        <div v-if="engine === 'Seedance'">
          <label class="mb-1.5 block text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>模型版本</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="m in sdModels"
              :key="m"
              class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
              :class="
                sdModel === m
                  ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
              "
              @click="pickSdModel(m)"
            >
              {{ m }}
            </button>
          </div>
          <span class="mt-1.5 block text-[11px] text-[#6B7280]">2.0 系列画质与运镜更强、算力消耗更高，请按需谨慎选择</span>
          <div v-if="showSdRef" class="mt-2.5 flex flex-col gap-2">
            <label class="text-[12px] font-medium">参考图（可选 · 图生视频）</label>
            <div
              class="cursor-pointer rounded-md border-2 border-dashed border-[#D1D5DB] p-2.5 text-center text-[11.5px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
            >
              🖼 上传参考图，让画面贴合你的产品
            </div>
            <label class="text-[12px] font-medium">参考视频（可选 · 动作参考）</label>
            <div
              class="cursor-pointer rounded-md border-2 border-dashed border-[#D1D5DB] p-2.5 text-center text-[11.5px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
            >
              🎞 上传参考视频，生成画面将参考其运镜与动作
            </div>
          </div>
        </div>

        <!-- Grok 专属 -->
        <div v-if="engine === 'Grok'" class="flex flex-col gap-2.5">
          <div>
            <label class="mb-1.5 block text-[12px] font-medium">参考图（可选 · 图生视频）</label>
            <div
              class="cursor-pointer rounded-md border-2 border-dashed border-[#D1D5DB] p-2.5 text-center text-[11.5px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
            >
              🖼 上传参考图，让画面贴合你的产品
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[12px] font-medium">生成通道</label>
            <Select
              v-model:value="grokChannel"
              :options="[
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
              ]"
              class="!w-full"
            />
          </div>
        </div>

        <!-- VEO 专属 -->
        <div v-if="engine === 'VEO'" class="flex flex-col gap-1.5">
          <label class="text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>上传三张图片（首帧 /
            中间帧 / 尾帧）</label>
          <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              v-for="(v, i) in veoImgs"
              :key="i"
              class="cursor-pointer rounded-md border-2 p-2 text-center text-[11px] transition-all"
              :class="
                v
                  ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3]'
                  : 'border-dashed border-[#D1D5DB] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]'
              "
              @click="toggleVeoImg(i)"
            >
              🖼 {{ v ? '已选择' : '点击上传' }}
            </button>
          </div>
          <span class="text-[11px] text-[#6B7280]">三张图须比例一致；VEO 默认 16:9 横版输出</span>
        </div>

        <div>
          <label class="mb-1.5 block text-[12px] font-medium"><span class="mr-0.5 text-[#EF4444]">*</span>提示词</label>
          <Input.TextArea
            v-model:value="prompt"
            :rows="4"
            placeholder="描述你想要的画面"
          />
          <div class="mt-1.5 flex flex-wrap gap-1.5">
            <button
              v-for="p in examplePrompts"
              :key="p"
              class="cursor-pointer rounded-full border border-[#E5E7EB] bg-[#F9FAFB] px-2.5 py-1 text-[11px] text-[#6B7280] hover:border-[#4B3FE3] hover:text-[#4B3FE3]"
              @click="fillExample(p)"
            >
              {{ p }}
            </button>
          </div>
        </div>

        <div v-if="engine !== 'VEO'">
          <label class="mb-1.5 block text-[12px] font-medium">时长</label>
          <div class="flex gap-2">
            <button
              v-for="d in durations"
              :key="d"
              class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
              :class="
                duration === d
                  ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
              "
              @click="pickDuration(d)"
            >
              {{ d === '5s' ? '5 秒' : '10 秒' }}
            </button>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-[12px] font-medium">画面比例</label>
          <div class="flex gap-2">
            <button
              v-for="r in ratios"
              :key="r"
              class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
              :class="
                ratio === r
                  ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
              "
              @click="pickRatio(r)"
            >
              {{ r }}
            </button>
          </div>
        </div>

        <div v-if="showQuality">
          <label class="mb-1.5 block text-[12px] font-medium">清晰度</label>
          <div class="flex gap-2">
            <button
              v-for="q in qualities"
              :key="q"
              class="cursor-pointer rounded-full border px-3 py-1.5 text-[12px]"
              :class="
                quality === q
                  ? 'border-[#4B3FE3] bg-[#EDEEFE] text-[#4B3FE3] font-semibold'
                  : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
              "
              @click="pickQuality(q)"
            >
              {{ q }}
            </button>
          </div>
        </div>

        <div class="rounded-md bg-[#F9FAFB] p-2.5 text-[12px] text-[#6B7280]">
          ⚡ 预计消耗：<b class="text-[#4B3FE3]">{{ cost }}</b> 算力点 ·
          当前余额 <b class="text-[#4B3FE3]">{{ points }}</b> 点
        </div>

        <Button type="primary" size="large" block @click="generate">
          🎬 生成视频
        </Button>
      </div>
    </Card>

    <!-- 右侧：作品库 -->
    <Card :bordered="false" class="!rounded-[14px]">
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
              <Button size="small">预览</Button>
              <Button size="small">下载</Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
