<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

const [Modal, modalApi] = useVbenModal({
  class: 'w-[calc(100%-32px)] sm:w-[520px]',
  confirmText: '我知道了',
  fullscreenButton: true,
  showCancelButton: false,
  title: '注意事项',
});

defineExpose({ modalApi });
</script>

<template>
  <Modal>
    <ul
      class="m-0 list-disc pl-[18px] text-[12.5px] leading-[2.1] text-[#6B7280]"
    >
      <li>
        建议<strong>一机一号</strong>环境运行：每台客户端只登录一个平台账号，降低风控风险。
      </li>
      <li>
        私信 / 关注 /
        点赞请控制在<strong>每日触发上限</strong>内，频率过高易被平台限流。
      </li>
      <li>触达话术请避免敏感词与夸大宣传，首次触达建议以引导私信为主。</li>
      <li>任务异常时：关闭任务浏览器 → 点击右上角刷新 → 重新执行。</li>
      <li>
        平台改版期间任务会自动暂停保护账号，适配完成后自动恢复，无需重装客户端。
      </li>
    </ul>
  </Modal>
</template>
