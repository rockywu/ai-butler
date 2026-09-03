<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockKeywordPresets } from '../../_shared/mock-data';

const searchQuery = ref('');

const filteredPresets = computed(() => {
  const query = searchQuery.value.trim();
  if (!query) return mockKeywordPresets;
  return mockKeywordPresets.filter(
    (item) =>
      item.name.includes(query) ||
      item.keywords.some((word) => word.includes(query)),
  );
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'name', minWidth: 120, title: '分类名称' },
      {
        field: 'keywords',
        formatter: ({ cellValue }: { cellValue: string[] }) =>
          (cellValue ?? []).join('、'),
        minWidth: 220,
        title: '包含关键词',
      },
      { field: 'createdAt', minWidth: 160, title: '创建时间' },
      { slots: { default: 'actions' }, title: '操作', width: 140 },
    ],
    data: filteredPresets.value,
    pagerConfig: { enabled: false },
    scrollX: { enabled: true },
  },
});

watch(filteredPresets, (data) => {
  gridApi.setGridOptions({ data });
});

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] lg:w-[780px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: '关键词预设',
});

defineExpose({ modalApi });

function refreshList() {
  gridApi.setGridOptions({ data: filteredPresets.value });
  message.success('列表已刷新');
}
</script>

<template>
  <Modal>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <Input
        v-model:value="searchQuery"
        class="w-[220px]"
        placeholder="搜索分类名称或关键词..."
        size="small"
      />
      <Button
        size="small"
        type="primary"
        @click="message.info('新建分类（演示）')"
      >
        ＋ 新建分类
      </Button>
      <Button size="small" @click="refreshList">刷新</Button>
      <Button size="small" @click="message.success('已导出选中项')">
        选择导出
      </Button>
      <Button size="small" @click="message.success('已全部导出')">
        全部导出
      </Button>
    </div>
    <Grid>
      <template #actions>
        <Button
          size="small"
          type="link"
          @click="message.info('编辑分类（演示）')"
        >
          编辑
        </Button>
        <Button size="small" type="link" @click="message.success('已删除')">
          删除
        </Button>
      </template>
    </Grid>
  </Modal>
</template>
