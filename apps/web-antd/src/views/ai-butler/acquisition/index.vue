<script lang="ts" setup>
import { computed, provide, ref } from 'vue';

import { message } from 'ant-design-vue';

import { pageGapClass } from '../_shared/chic-classes';
import { acqLeadCards, acqTaskCards, acqZoneCards } from '../_shared/mock-data';
import ActionCard from './action-card.vue';
import AccountModal from './modals/account-modal.vue';
import AcqCompetitorModal from './modals/acq-competitor-modal.vue';
import AcqFanModal from './modals/acq-fan-modal.vue';
import AcqKeywordModal from './modals/acq-keyword-modal.vue';
import AcqLiveModal from './modals/acq-live-modal.vue';
import AcqVideoModal from './modals/acq-video-modal.vue';
import AuthModal from './modals/auth-modal.vue';
import BatchModal from './modals/batch-modal.vue';
import CommentModal from './modals/comment-modal.vue';
import FanListModal from './modals/fan-list-modal.vue';
import GuideModal from './modals/guide-modal.vue';
import InteractModal from './modals/interact-modal.vue';
import KeywordModal from './modals/keyword-modal.vue';
import LiveCommentModal from './modals/live-comment-modal.vue';
import NoticeModal from './modals/notice-modal.vue';
import OverviewModal from './modals/overview-modal.vue';
import ProcessModal from './modals/process-modal.vue';
import ReplyModal from './modals/reply-modal.vue';
import TaskDetailModal from './modals/task-detail-modal.vue';
import TasksModal from './modals/tasks-modal.vue';
import SmartIcons from './smart-icons.vue';

type PlatformKey = 'douyin' | 'kuaishou' | 'xiaohongshu';
type OpenModalFn = (key: string, data?: unknown) => void;
type ModalExpose = {
  modalApi: {
    open: () => void;
    setData: (data: unknown) => void;
    setState: (state: Record<string, unknown>) => void;
  };
};

const PLATFORM_LABEL: Record<PlatformKey, string> = {
  douyin: '某音',
  kuaishou: '某手',
  xiaohongshu: '小某书',
};

const platforms: Array<{
  dotClass: string;
  key: PlatformKey;
  label: string;
  short: string;
}> = [
  {
    key: 'douyin',
    label: '某音',
    short: '某',
    dotClass: 'bg-[linear-gradient(135deg,#28E0E8,#111827_50%,#FF4D8D)]',
  },
  {
    key: 'xiaohongshu',
    label: '小某书',
    short: '小',
    dotClass: 'bg-[linear-gradient(135deg,#FF657C,#FF2442)]',
  },
  {
    key: 'kuaishou',
    label: '某手',
    short: '某',
    dotClass: 'bg-[linear-gradient(135deg,#FFB34D,#FF5000)]',
  },
];

const activePlatform = ref<PlatformKey>('douyin');
const accountModalTitle = computed(
  () => `账号管理 · ${PLATFORM_LABEL[activePlatform.value]}`,
);

const overviewModalRef = ref<ModalExpose>();
const noticeModalRef = ref<ModalExpose>();
const guideModalRef = ref<ModalExpose>();
const accountModalRef = ref<ModalExpose>();
const replyModalRef = ref<ModalExpose>();
const keywordModalRef = ref<ModalExpose>();
const processModalRef = ref<ModalExpose>();
const tasksModalRef = ref<ModalExpose>();
const authModalRef = ref<ModalExpose>();
const taskDetailModalRef = ref<ModalExpose>();
const interactModalRef = ref<ModalExpose>();
const commentModalRef = ref<ModalExpose>();
const liveCommentModalRef = ref<ModalExpose>();
const fanListModalRef = ref<ModalExpose>();
const batchModalRef = ref<ModalExpose>();
const acqCompetitorModalRef = ref<ModalExpose>();
const acqVideoModalRef = ref<ModalExpose>();
const acqKeywordModalRef = ref<ModalExpose>();
const acqLiveModalRef = ref<ModalExpose>();
const acqFanModalRef = ref<ModalExpose>();

const modalRefMap: Record<string, typeof overviewModalRef> = {
  'auth-modal': authModalRef,
  'm-account': accountModalRef,
  'm-acq-competitor': acqCompetitorModalRef,
  'm-acq-fan': acqFanModalRef,
  'm-acq-keyword': acqKeywordModalRef,
  'm-acq-live': acqLiveModalRef,
  'm-acq-video': acqVideoModalRef,
  'm-batch': batchModalRef,
  'm-comment': commentModalRef,
  'm-fan': fanListModalRef,
  'm-guide': guideModalRef,
  'm-interact': interactModalRef,
  'm-keyword': keywordModalRef,
  'm-live': liveCommentModalRef,
  'm-notice': noticeModalRef,
  'm-overview': overviewModalRef,
  'm-process': processModalRef,
  'm-reply': replyModalRef,
  'm-tasks': tasksModalRef,
  'task-detail-modal': taskDetailModalRef,
};

function openModal(key: string, data?: unknown) {
  const api = modalRefMap[key]?.value?.modalApi;
  if (!api) return;
  if (data !== undefined) {
    api.setData(data);
  }
  api.open();
}

function switchPlatform(key: PlatformKey) {
  activePlatform.value = key;
  const label = PLATFORM_LABEL[key];
  message.info(`已切换至${label} · 账号与任务数据按平台过滤`);
  accountModalRef.value?.modalApi.setState({ title: `账号管理 · ${label}` });
}

provide<OpenModalFn>('openModal', openModal);
provide('activePlatform', activePlatform);
provide('accountModalTitle', accountModalTitle);
</script>

<template>
  <div :class="pageGapClass">
    <SmartIcons />

    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#BCEDE1] bg-[#EDFBF7] px-3 py-2 text-[11.5px] font-medium text-[#176B59] sm:px-3.5 sm:py-2.5 sm:text-[12.5px]"
    >
      <span>🟢 家居好物 · 关键词拓客 · 运行中 · 18 / 30 · 由本机 RPA 引擎执行</span>
    </div>

    <div
      class="flex flex-wrap items-center gap-2 rounded-[10px] border border-[#DDE1F2] bg-[linear-gradient(90deg,#F5F7FF,#FAF7FF)] px-3 py-2 text-[11.5px] leading-relaxed text-[#4D566D] sm:px-3.5 sm:text-[12px]"
    >
      <span class="shrink-0 text-[13px] text-[#7A60E8] sm:text-[14px]">⚠</span>
      <span>
        当遇到任务执行异常时（如手动结束任务，但任务提示还在执行），请手动关闭任务浏览器，点击软件右上角的刷新按钮，重新执行任务即可。
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="platform in platforms"
        :key="platform.key"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[11.5px] transition-all sm:px-3 sm:text-[12.5px]"
        :class="
          activePlatform === platform.key
            ? 'border-[#111A38] bg-[#111A38] text-white shadow-[0_5px_14px_rgba(32,48,100,.2)]'
            : 'border-[#DCDAD4] bg-white text-[#6B7280] hover:border-[#D1D5DB]'
        "
        type="button"
        @click="switchPlatform(platform.key)"
      >
        <span
          class="grid h-[15px] w-[15px] place-items-center rounded-[4px] text-[9px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)]"
          :class="platform.dotClass"
        >
          {{ platform.short }}
        </span>
        {{ platform.label }}
      </button>
      <button
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-dashed border-[#DCDAD4] bg-white px-2.5 py-1.5 text-[11.5px] text-[#6B7280] transition-all hover:border-[#4C59C7] hover:text-[#4C59C7] sm:px-3 sm:text-[12.5px]"
        type="button"
        @click="openModal('m-overview')"
      >
        📊 数据总览
      </button>
      <button
        class="inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1.5 text-[11.5px] font-semibold text-[#DC2626] transition-all hover:bg-[#FEE2E2] sm:px-3 sm:text-[12.5px]"
        type="button"
        @click="openModal('m-notice')"
      >
        ⚠ 注意事项!!!
      </button>
      <a
        class="ml-auto cursor-pointer text-[11.5px] font-semibold text-[#4C59C7] hover:underline sm:text-[12px]"
        @click.prevent="openModal('m-guide')"
      >
        ℹ 使用指引
      </a>
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      主要功能
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        账号 · 话术 · 关键词 · 进程
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4"
    >
      <ActionCard
        v-for="card in acqZoneCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        layout="zone"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      拓客专区
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        五种获客方式 · RPA 本地执行
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5"
    >
      <ActionCard
        v-for="card in acqLeadCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>

    <div
      class="mb-[-4px] flex items-center gap-2 py-[2px] text-[12.5px] font-semibold text-[#0A0A0A] sm:text-[13.5px]"
    >
      <span
        class="h-4 w-[3px] shrink-0 rounded-[4px] bg-[linear-gradient(135deg,#5D6CFF_0_36%,#B553FF_36%_68%,#21CAE5_68%)] shadow-[0_3px_10px_rgba(91,108,255,.28)]"
      ></span>
      任务明细
      <span class="text-[11px] font-normal text-[#6B7280] sm:text-[11.5px]">
        线索沉淀 · 可导出跟进
      </span>
    </div>
    <div
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-5"
    >
      <ActionCard
        v-for="card in acqTaskCards"
        :key="card.modalKey"
        :desc="card.desc"
        :icon-id="card.iconId"
        :title="card.title"
        :tone="card.tone"
        @click="openModal(card.modalKey)"
      />
    </div>

    <OverviewModal ref="overviewModalRef" />
    <NoticeModal ref="noticeModalRef" />
    <GuideModal ref="guideModalRef" />
    <AccountModal ref="accountModalRef" />
    <ReplyModal ref="replyModalRef" />
    <KeywordModal ref="keywordModalRef" />
    <ProcessModal ref="processModalRef" />
    <TasksModal ref="tasksModalRef" />
    <AuthModal ref="authModalRef" />
    <TaskDetailModal ref="taskDetailModalRef" />
    <InteractModal ref="interactModalRef" />
    <CommentModal ref="commentModalRef" />
    <LiveCommentModal ref="liveCommentModalRef" />
    <FanListModal ref="fanListModalRef" />
    <BatchModal ref="batchModalRef" />
    <AcqCompetitorModal ref="acqCompetitorModalRef" />
    <AcqVideoModal ref="acqVideoModalRef" />
    <AcqKeywordModal ref="acqKeywordModalRef" />
    <AcqLiveModal ref="acqLiveModalRef" />
    <AcqFanModal ref="acqFanModalRef" />
  </div>
</template>
