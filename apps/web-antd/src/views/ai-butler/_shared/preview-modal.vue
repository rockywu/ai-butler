<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

export type PreviewMedia = {
  color: string;
  duration: string;
  extra: string;
  ratio: string;
  title: string;
};

const media = ref<PreviewMedia>();

const [Modal, modalApi] = useVbenModal<PreviewMedia>({
  cancelText: '关闭',
  class: 'w-[calc(100%-32px)] md:w-[640px]',
  confirmText: '下载',
  fullscreenButton: true,
  onConfirm() {
    message.success('已下载到本地（演示）');
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData();
    media.value = data;
    modalApi.setState({
      title: data?.title ? `预览 · ${data.title}` : '视频预览',
    });
  },
  title: '视频预览',
});

defineExpose({ modalApi });

function playPreview() {
  message.success('播放中…（演示）');
}
</script>

<template>
  <Modal>
    <div v-if="media">
      <div
        class="relative grid h-[300px] place-items-center overflow-hidden rounded-[10px] text-white"
        :style="{ background: media.color }"
      >
        <button
          class="grid h-[52px] w-[52px] place-items-center rounded-full bg-white/90 text-[20px] text-[#0A0A0A] shadow"
          type="button"
          @click="playPreview"
        >
          ▶
        </button>
        <span
          class="absolute top-2.5 left-2.5 rounded-md bg-black/45 px-2 py-0.5 text-[11px]"
        >
          {{ media.ratio }}
        </span>
        <span
          class="absolute right-2.5 bottom-2.5 rounded-md bg-black/55 px-2 py-0.5 text-[11px]"
        >
          {{ media.duration }}
        </span>
      </div>
      <div
        class="mt-3 whitespace-pre-line text-[12.5px] leading-relaxed text-[#6B7280]"
      >
        {{ media.extra }}
      </div>
    </div>
  </Modal>
</template>
