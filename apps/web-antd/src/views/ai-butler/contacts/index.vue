<script lang="ts" setup>
import type { MockContact } from '../_shared/mock-data';

import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  Avatar,
  Button,
  Card,
  Input,
  message,
  Select,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import {
  cardClass,
  pageGapClass,
  primaryBtnClass,
} from '../_shared/chic-classes';
import { filterContacts } from '../_shared/contact-filter';
import { acqPlatformLabels, mockContacts } from '../_shared/mock-data';
import ImportModal from './import-modal.vue';

type ModalExpose = {
  modalApi: {
    open: () => void;
  };
};

const router = useRouter();
const importModalRef = ref<ModalExpose>();

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

const query = reactive({
  platform: 'all',
  search: '',
  source: 'all',
  status: 'all',
});

const filteredData = computed(() => filterContacts(mockContacts, query));

function platformColor(key: string) {
  if (key === 'xiaohongshu') return 'error';
  if (key === 'kuaishou') return 'orange';
  return 'default';
}

function statusColor(status: string) {
  if (status === '已转化') return 'success';
  if (status === '已回复') return 'processing';
  if (status === '待跟进') return 'warning';
  return 'default';
}

const [Grid, gridApi] = useVbenVxeGrid<MockContact>({
  gridOptions: {
    columns: [
      {
        align: 'left',
        fixed: 'left',
        minWidth: 160,
        slots: { default: 'contact' },
        title: '联系人',
      },
      { minWidth: 90, slots: { default: 'platform' }, title: '平台' },
      { field: 'source', minWidth: 180, title: '来源任务' },
      { field: 'channel', minWidth: 120, title: '触达方式' },
      { field: 'phone', minWidth: 130, title: '联系方式' },
      { field: 'lastInteract', minWidth: 110, title: '最近互动' },
      { minWidth: 90, slots: { default: 'status' }, title: '状态' },
      {
        fixed: 'right',
        minWidth: 180,
        slots: { default: 'actions' },
        title: '操作',
      },
    ],
    data: filteredData.value,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id' },
    scrollX: { enabled: true },
  },
});

watch(filteredData, (data) => {
  gridApi.setGridOptions({ data });
});

function onImport() {
  importModalRef.value?.modalApi.open();
}

function onExport() {
  message.success('已导出 86 条联系人（Excel）');
}

function viewContact() {
  router.push({ name: 'AiButlerChat' });
}

function followContact(row: MockContact) {
  message.info(`已标记跟进 · ${row.name}（演示）`);
}

function markContact(row: MockContact) {
  message.info(`已标记 · ${row.name}（演示）`);
}
</script>

<template>
  <div :class="pageGapClass">
    <div class="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4">
      <div
        v-for="item in stats"
        :key="item.label"
        class="relative overflow-hidden rounded-[15px] border border-[#DCDAD4] bg-white p-3.5 shadow-[0_1px_0_rgba(10,10,10,.04),0_5px_16px_rgba(10,10,10,.035)] sm:p-4"
      >
        <div class="mb-1 text-[11.5px] text-[#71716B] sm:mb-1.5 sm:text-[12px]">
          {{ item.label }}
        </div>
        <div
          class="text-[20px] font-bold leading-tight text-[#0A0A0A] sm:text-[22px]"
        >
          {{ item.value }}
        </div>
        <div
          class="mt-[3px] text-[10.5px] sm:text-[11px]"
          :class="item.positive ? 'text-[#16803C]' : 'text-[#71716B]'"
        >
          {{ item.delta }}
        </div>
      </div>
    </div>

    <Card :bordered="false" :class="cardClass">
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-[13px] font-semibold">联系人明细</span>
          <div class="flex items-center gap-2">
            <Button size="small" @click="onImport">➡ 导入好友任务</Button>
            <Button
              :class="primaryBtnClass"
              size="small"
              type="primary"
              @click="onExport"
            >
              ⬇ 导出
            </Button>
          </div>
        </div>
      </template>

      <div
        class="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <Select
          v-model:value="query.platform"
          :options="platformOptions"
          class="!w-full sm:!w-[120px]"
        />
        <Select
          v-model:value="query.status"
          :options="statusOptions"
          class="!w-full sm:!w-[120px]"
        />
        <Select
          v-model:value="query.source"
          :options="sourceOptions"
          class="!w-full sm:!w-[200px]"
        />
        <Input
          v-model:value="query.search"
          allow-clear
          class="!w-full sm:!w-[200px]"
          placeholder="搜索联系人 / 联系方式"
        />
        <span class="text-[11px] text-[#6B7280]">
          共 {{ filteredData.length }} 条
        </span>
      </div>

      <div class="min-w-0 overflow-x-auto">
        <Grid>
          <template #contact="{ row }">
            <div class="flex items-center gap-2">
              <Avatar :size="28" class="!flex-shrink-0">{{ row.ava }}</Avatar>
              <span class="text-[13px] font-medium">{{ row.name }}</span>
            </div>
          </template>
          <template #platform="{ row }">
            <Tag :color="platformColor(row.platform)">
              {{ acqPlatformLabels[row.platform] ?? row.platform }}
            </Tag>
          </template>
          <template #status="{ row }">
            <Tag :color="statusColor(row.status)">{{ row.status }}</Tag>
          </template>
          <template #actions="{ row }">
            <Button size="small" type="link" @click="viewContact">查看</Button>
            <Button size="small" type="link" @click="followContact(row)">
              跟进
            </Button>
            <Button size="small" type="link" @click="markContact(row)">
              标记
            </Button>
          </template>
        </Grid>
      </div>
    </Card>

    <ImportModal ref="importModalRef" />
  </div>
</template>
