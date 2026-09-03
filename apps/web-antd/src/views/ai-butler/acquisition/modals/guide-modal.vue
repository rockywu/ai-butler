<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

const [Modal, modalApi] = useVbenModal({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  fullscreenButton: true,
  showConfirmButton: false,
  title: 'ℹ 使用指引',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <ol
      class="m-0 list-decimal pl-[18px] text-[12.5px] leading-[2.1] text-[#6B7280]"
    >
      <li>
        <strong>授权账号</strong>：账号管理 → 授权账号，在客户端内完成平台登录。
      </li>
      <li><strong>配置预设</strong>：预设好关键词分类与回复 / 私信话术。</li>
      <li>
        <strong>创建拓客任务</strong>：拓客专区选择方式，配置关键词与触达动作后提交。
      </li>
      <li>
        <strong>跟踪执行</strong>：运行进程管理查看实时进度，异常按提示自助处理。
      </li>
      <li>
        <strong>沉淀线索</strong>：任务明细各列表查看、导出触达记录，跟进转化。
      </li>
    </ol>
  </Modal>
</template>
