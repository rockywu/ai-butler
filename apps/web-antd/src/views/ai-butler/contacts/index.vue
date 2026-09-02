<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import { computed, h, ref } from 'vue';

import {
  Avatar,
  Button,
  Card,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

interface Contact {
  id: string;
  name: string;
  ava: string;
  platform: 'douyin' | 'kuaishou' | 'xiaohongshu';
  source: string;
  channel: string;
  phone: string;
  lastInteract: string;
  status: '已回复' | '已转化' | '待跟进' | '未回复';
}

const platformOptions = [
  { label: '全部平台', value: 'all' },
  { label: '某音', value: 'douyin' },
  { label: '小某书', value: 'xiaohongshu' },
  { label: '某手', value: 'kuaishou' },
];
const statusOptions = [
  { label: '全部状态', value: 'all' },
  { label: '未回复', value: '未回复' },
  { label: '已回复', value: '已回复' },
  { label: '待跟进', value: '待跟进' },
  { label: '已转化', value: '已转化' },
];
const sourceOptions = [
  { label: '全部来源任务', value: 'all' },
  { label: '关键词拓客 · 家居好物', value: '关键词拓客 · 家居好物' },
  { label: '对标拓客 · 竞品A粉丝', value: '对标拓客 · 竞品A粉丝' },
  { label: '视频拓客 · ins风家具', value: '视频拓客 · ins风家具' },
  { label: '直播拓客 · 家居专场', value: '直播拓客 · 家居专场' },
  { label: '粉丝拓客 · 老粉激活', value: '粉丝拓客 · 老粉激活' },
];

const stats = [
  { label: '联系人总数', value: '86', delta: '三平台合计' },
  { label: '今日新增', value: '12', delta: '↑ 3 较昨日', positive: true },
  { label: '待跟进', value: '18', delta: '建议 24h 内跟进' },
  { label: '已转化', value: '9', delta: '转化率 10.5%' },
];

const data: Contact[] = [
  {
    id: 'c1',
    name: '家居控小林',
    ava: '🧑',
    platform: 'douyin',
    source: '关键词拓客 · 家居好物',
    channel: '私信 + 评论',
    phone: '138****6688',
    lastInteract: '11:05',
    status: '待跟进',
  },
  {
    id: 'c2',
    name: '装修老张',
    ava: '👷',
    platform: 'douyin',
    source: '对标拓客 · 竞品A粉丝',
    channel: '私信',
    phone: '139****1024',
    lastInteract: '昨天 21:20',
    status: '已回复',
  },
  {
    id: 'c3',
    name: '小红薯·悦悦',
    ava: '👩',
    platform: 'xiaohongshu',
    source: '视频拓客 · ins风家具',
    channel: '私信',
    phone: '186****7799',
    lastInteract: '11:41',
    status: '已回复',
  },
  {
    id: 'c4',
    name: '某手-阿强',
    ava: '🧢',
    platform: 'kuaishou',
    source: '直播拓客 · 家居专场',
    channel: '私信',
    phone: '—',
    lastInteract: '09:58',
    status: '未回复',
  },
  {
    id: 'c5',
    name: '梅姐',
    ava: '👩‍🦰',
    platform: 'douyin',
    source: '粉丝拓客 · 老粉激活',
    channel: '私信',
    phone: '188****0011',
    lastInteract: '3 天前',
    status: '已转化',
  },
  {
    id: 'c6',
    name: '阿豪',
    ava: '🧑‍💻',
    platform: 'xiaohongshu',
    source: '关键词拓客 · 出租屋改造',
    channel: '私信 + 评论',
    phone: '177****5533',
    lastInteract: '08:47',
    status: '已回复',
  },
  {
    id: 'c7',
    name: '星辰大海',
    ava: '星',
    platform: 'douyin',
    source: '对标拓客 · 竞品A粉丝',
    channel: '私信',
    phone: '150****8821',
    lastInteract: '昨天 18:30',
    status: '待跟进',
  },
  {
    id: 'c8',
    name: '小丸子不甜',
    ava: '丸',
    platform: 'douyin',
    source: '粉丝拓客 · 老粉激活',
    channel: '私信',
    phone: '—',
    lastInteract: '昨天 14:10',
    status: '未回复',
  },
];

const platform = ref('all');
const status = ref('all');
const source = ref('all');
const search = ref('');

const filteredData = computed(() => {
  return data.filter((c) => {
    if (platform.value !== 'all' && c.platform !== platform.value) return false;
    if (status.value !== 'all' && c.status !== status.value) return false;
    if (source.value !== 'all' && c.source !== source.value) return false;
    if (
      search.value &&
      !c.name.includes(search.value) &&
      !c.phone.includes(search.value)
    )
      return false;
    return true;
  });
});

const platformLabel = (key: string) => {
  if (key === 'douyin') return { label: '某音', color: 'default' };
  if (key === 'xiaohongshu') return { label: '小某书', color: 'error' };
  if (key === 'kuaishou') return { label: '某手', color: 'orange' };
  return { label: '-', color: 'default' };
};

const statusColor = (s: Contact['status']) => {
  if (s === '已转化') return 'success';
  if (s === '已回复') return 'processing';
  if (s === '待跟进') return 'warning';
  return 'default';
};

const columns: TableColumnsType<Contact> = [
  {
    title: '联系人',
    dataIndex: 'name',
    fixed: 'left',
    width: 200,
    customRender: ({ record }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(
          Avatar,
          { size: 28, class: '!flex-shrink-0' },
          () => (record as Contact).ava,
        ),
        h(
          'span',
          { class: 'text-[13px] font-medium' },
          (record as Contact).name,
        ),
      ]),
  },
  {
    title: '平台',
    dataIndex: 'platform',
    width: 100,
    customRender: ({ record }) => {
      const p = platformLabel((record as Contact).platform);
      return h(Tag, { color: p.color }, () => p.label);
    },
  },
  { title: '来源任务', dataIndex: 'source', ellipsis: true },
  { title: '触达方式', dataIndex: 'channel', width: 120 },
  { title: '联系方式', dataIndex: 'phone', width: 130 },
  { title: '最近互动', dataIndex: 'lastInteract', width: 130 },
  {
    title: '状态',
    dataIndex: 'status',
    width: 90,
    customRender: ({ record }) =>
      h(
        Tag,
        { color: statusColor((record as Contact).status) },
        () => (record as Contact).status,
      ),
  },
  {
    title: '操作',
    width: 160,
    fixed: 'right',
    customRender: () =>
      h('div', { class: 'flex gap-2' }, [
        h(
          'a',
          { class: 'cursor-pointer text-[#4B3FE3] hover:underline mr-2' },
          '查看',
        ),
        h(
          'a',
          { class: 'cursor-pointer text-[#4B3FE3] hover:underline mr-2' },
          '跟进',
        ),
        h(
          'a',
          { class: 'cursor-pointer text-[#4B3FE3] hover:underline' },
          '标记',
        ),
      ]),
  },
];

function onImport() {
  message.info('打开「导入好友任务」（演示）');
}
function onExport() {
  message.success('已导出 86 条联系人（演示）');
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <!-- 统计：移动端 2 列，>= md 4 列 -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="rounded-[14px] border border-[#E5E7EB] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      >
        <div class="mb-1.5 text-[12px] text-[#6B7280]">{{ s.label }}</div>
        <div class="text-[22px] font-bold leading-tight">{{ s.value }}</div>
        <div
          v-if="s.delta"
          class="mt-[3px] text-[11px]"
          :class="s.positive ? 'text-[#10B981]' : 'text-[#6B7280]'"
        >
          {{ s.delta }}
        </div>
      </div>
    </div>

    <Card :bordered="false" class="!rounded-[14px]">
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-[13px] font-semibold">联系人明细</span>
          <div class="flex items-center gap-2">
            <Button size="small" @click="onImport">➡ 导入好友任务</Button>
            <Button size="small" type="primary" @click="onExport">
              ⬇ 导出
            </Button>
          </div>
        </div>
      </template>

      <!-- 筛选：移动端纵向堆叠，>= sm 横向 -->
      <div
        class="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Select
          v-model:value="platform"
          :options="platformOptions"
          class="!w-full sm:!w-[120px]"
        />
        <Select
          v-model:value="status"
          :options="statusOptions"
          class="!w-full sm:!w-[120px]"
        />
        <Select
          v-model:value="source"
          :options="sourceOptions"
          class="!w-full sm:!w-[200px]"
        />
        <Input
          v-model:value="search"
          placeholder="搜索联系人 / 联系方式"
          class="!w-full sm:!w-[200px]"
          allow-clear
        />
        <span class="text-[11px] text-[#6B7280]">
          共 {{ filteredData.length }} 条
        </span>
      </div>

      <Table
        :columns="columns"
        :data-source="filteredData"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        :scroll="{ x: 800 }"
        size="small"
        row-key="id"
      />
    </Card>
  </div>
</template>
