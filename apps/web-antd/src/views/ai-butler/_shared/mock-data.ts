export interface WorkbenchStat {
  accentClass: string;
  delta: string;
  label: string;
  positive?: boolean;
  value: string;
}

export interface WorkbenchDevice {
  id: string;
  label: string;
  meta: string;
  status: string;
  tone: 'success' | 'warning';
}

export interface WorkbenchFeed {
  dotClass: string;
  id: string;
  text: string;
  time: string;
}

export const workbenchStats: WorkbenchStat[] = [
  {
    label: '运行中任务',
    value: '1',
    delta: '关键词拓客 · 18/30',
    accentClass: 'bg-[#6675F5]',
  },
  {
    label: '今日新增线索',
    value: '128',
    delta: '↑ 23% 较昨日',
    positive: true,
    accentClass: 'bg-[#16B9D4]',
  },
  {
    label: '累计私信触达',
    value: '3,420',
    delta: '含自动回复命中',
    accentClass: 'bg-[#9B60E8]',
  },
  {
    label: '今日自动化执行',
    value: '42',
    delta: '成功 40 · 待处理 2',
    accentClass: 'bg-[#FF8C5A]',
  },
];

export const workbenchDevices: WorkbenchDevice[] = [
  {
    id: 'WIN-001',
    label: 'WIN-001',
    status: '在线',
    tone: 'success',
    meta: '客户端 v1.0.2 · 心跳 10 秒前',
  },
  {
    id: 'MAC-002',
    label: 'MAC-002',
    status: '未启动',
    tone: 'warning',
    meta: '上次在线 3 天前',
  },
];

export const workbenchFeeds: WorkbenchFeed[] = [
  {
    id: 'f1',
    text: 'AI 已自动回复 3 条私信 ·「家居控小林」在咨询价格，建议尽快人工接管',
    time: '11:05',
    dotClass: 'bg-[#16A34A]',
  },
  {
    id: 'f2',
    text: '关键词「家居好物」命中 1 条评论，已自动回复并发送私信',
    time: '10:32',
    dotClass: 'bg-[#16A34A]',
  },
  {
    id: 'f3',
    text: '数字人视频《产品介绍 · 智能获客篇》生成完成（消耗 50 算力点）',
    time: '09:15',
    dotClass: 'bg-[#6675F5]',
  },
  {
    id: 'f4',
    text: '直播拓客任务已暂停：直播间已结束',
    time: '昨天 21:40',
    dotClass: 'bg-[#D97706]',
  },
  {
    id: 'f5',
    text: '文生视频 1 条生成完成 · Seedance · 1080P（消耗 30 算力点）',
    time: '昨天 18:22',
    dotClass: 'bg-[#6675F5]',
  },
];

export type AcqCardTone = 'blue' | 'cyan' | 'green' | 'orange' | 'purple';

export interface AcqActionCard {
  desc: string;
  iconId: string;
  key: string;
  modalKey: string;
  title: string;
  tone: AcqCardTone;
}

export const acqZoneCards: AcqActionCard[] = [
  {
    key: 'account',
    title: '账号管理',
    desc: '授权和管理平台账号，查看账号状态和数据',
    iconId: 'si-account',
    tone: 'purple',
    modalKey: 'm-account',
  },
  {
    key: 'reply',
    title: '回复 / 私信预设',
    desc: '自由挑选已保存的常用语句，灵活应对各类私信场景，回复更轻松',
    iconId: 'si-reply',
    tone: 'orange',
    modalKey: 'm-reply',
  },
  {
    key: 'keyword',
    title: '关键词预设',
    desc: '预先配置目标关键词，智能筛选并识别出包含该词汇的用户评论，精准锁定意向客户',
    iconId: 'si-keyword',
    tone: 'cyan',
    modalKey: 'm-keyword',
  },
  {
    key: 'process',
    title: '运行进程管理',
    desc: '查看当前运行中的任务，可对其进行操作',
    iconId: 'si-process',
    tone: 'green',
    modalKey: 'm-process',
  },
];

export const acqLeadCards: AcqActionCard[] = [
  {
    key: 'competitor',
    title: '对标拓客',
    desc: '针对特定用户精准拓客，分析竞争对手粉丝与评论',
    iconId: 'si-competitor',
    tone: 'blue',
    modalKey: 'm-acq-competitor',
  },
  {
    key: 'video',
    title: '视频拓客',
    desc: '通过视频内容拓客，分析视频表现和受众',
    iconId: 'si-video',
    tone: 'orange',
    modalKey: 'm-acq-video',
  },
  {
    key: 'keyword',
    title: '关键词拓客',
    desc: '基于关键词搜索拓客，精准定位目标用户',
    iconId: 'si-searchlead',
    tone: 'green',
    modalKey: 'm-acq-keyword',
  },
  {
    key: 'live',
    title: '直播拓客',
    desc: '基于直播间配合关键词拓客，精准定位目标用户',
    iconId: 'si-live',
    tone: 'purple',
    modalKey: 'm-acq-live',
  },
  {
    key: 'fan',
    title: '粉丝拓客',
    desc: '针对粉丝进行拓客，分析粉丝互动和转化效果',
    iconId: 'si-fan',
    tone: 'blue',
    modalKey: 'm-acq-fan',
  },
];

export const acqTaskCards: AcqActionCard[] = [
  {
    key: 'tasks',
    title: '任务列表',
    desc: '查看已执行的任务列表，了解执行进度和结果',
    iconId: 'si-tasks',
    tone: 'green',
    modalKey: 'm-tasks',
  },
  {
    key: 'interact',
    title: '互动记录列表',
    desc: '查看点赞和关注的历史记录，分析互动效果',
    iconId: 'si-interact',
    tone: 'blue',
    modalKey: 'm-interact',
  },
  {
    key: 'comment',
    title: '数据评论列表',
    desc: '查看和管理账号的评论数据和互动记录',
    iconId: 'si-comments',
    tone: 'purple',
    modalKey: 'm-comment',
  },
  {
    key: 'live',
    title: '直播评论列表',
    desc: '查看和管理直播间的评论数据和互动记录',
    iconId: 'si-livecomments',
    tone: 'orange',
    modalKey: 'm-live',
  },
  {
    key: 'fan',
    title: '粉丝列表',
    desc: '查看和管理已采集粉丝数据与触达状态',
    iconId: 'si-fanlist',
    tone: 'purple',
    modalKey: 'm-fan',
  },
];
