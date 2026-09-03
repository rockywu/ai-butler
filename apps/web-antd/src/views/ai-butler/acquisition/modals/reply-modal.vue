<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { mockReplyPresets } from '../../_shared/mock-data';

const typeFilter = ref('全部类型');
const categoryQuery = ref('');
const contentQuery = ref('');

const filteredPresets = computed(() =>
  mockReplyPresets.filter((item) => {
    if (typeFilter.value !== '全部类型' && item.type !== typeFilter.value) {
      return false;
    }
    if (categoryQuery.value && !item.category.includes(categoryQuery.value)) {
      return false;
    }
    if (contentQuery.value && !item.content.includes(contentQuery.value)) {
      return false;
    }
    return true;
  }),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'id', title: 'ID', width: 90 },
      { field: 'category', title: '所属分类', width: 110 },
      { field: 'type', title: '类型', width: 80 },
      { field: 'content', minWidth: 220, title: '内容' },
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
  title: '回复 / 私信预设',
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
      <Select
        v-model:value="typeFilter"
        class="w-[130px]"
        :options="[
          { label: '全部类型', value: '全部类型' },
          { label: '私信', value: '私信' },
          { label: '评论', value: '评论' },
        ]"
        size="small"
      />
      <Input
        v-model:value="categoryQuery"
        class="w-[140px]"
        placeholder="输入分类搜索"
        size="small"
      />
      <Input
        v-model:value="contentQuery"
        class="w-[180px]"
        placeholder="请输入搜索内容"
        size="small"
      />
      <Button
        size="small"
        type="primary"
        @click="message.info('新建预设（演示）')"
      >
        ＋ 新建
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
          @click="message.info('编辑预设（演示）')"
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
