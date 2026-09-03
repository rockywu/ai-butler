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

export const acqPlatformLabels: Record<string, string> = {
  douyin: '某音',
  kuaishou: '某手',
  xiaohongshu: '小某书',
};

export const acqTaskStatusLabels: Record<string, string> = {
  failed: '异常',
  paused: '已暂停',
  pending: '待执行',
  running: '执行中',
  success: '已完成',
};

export interface MockAccount {
  agent: string;
  compat: boolean;
  createdAt: string;
  gender: string;
  id: string;
  initTimeout: number;
  letter: string;
  listenOn: boolean;
  maxPrivateMsg: number;
  nickname: string;
  platform: string;
  wxMatch: boolean;
}

export interface MockTask {
  accountName: string;
  completed: number;
  createdAt: string;
  id: string;
  name: string;
  platform: string;
  progress: number;
  settings: Record<string, string>;
  status: string;
  total: number;
  typeLabel: string;
}

export interface MockReplyPreset {
  category: string;
  content: string;
  createdAt: string;
  id: string;
  type: string;
}

export interface MockKeywordPreset {
  createdAt: string;
  id: string;
  keywords: string[];
  name: string;
}

export interface MockProcess {
  account: string;
  createdAt: string;
  follow: string;
  id: string;
  like: string;
  msg: string;
  platform: string;
  reply: string;
  target: string;
  type: string;
}

export const mockAccounts: MockAccount[] = [
  {
    id: 'a1',
    nickname: '小雅来啦',
    gender: '女',
    letter: '雅',
    platform: 'douyin',
    agent: '默认智能体',
    compat: true,
    wxMatch: true,
    createdAt: '2026-08-10 14:23',
    initTimeout: 20,
    maxPrivateMsg: 6,
    listenOn: true,
  },
  {
    id: 'a2',
    nickname: '品牌官号-01',
    gender: '未知',
    letter: '官',
    platform: 'douyin',
    agent: '品牌智能体',
    compat: false,
    wxMatch: false,
    createdAt: '2026-08-08 09:12',
    initTimeout: 30,
    maxPrivateMsg: 8,
    listenOn: false,
  },
  {
    id: 'a3',
    nickname: '运营小号-A',
    gender: '男',
    letter: '运',
    platform: 'douyin',
    agent: '',
    compat: false,
    wxMatch: false,
    createdAt: '2026-08-05 16:45',
    initTimeout: 25,
    maxPrivateMsg: 5,
    listenOn: false,
  },
  {
    id: 'a4',
    nickname: '护肤测评',
    gender: '女',
    letter: '护',
    platform: 'xiaohongshu',
    agent: '默认智能体',
    compat: true,
    wxMatch: false,
    createdAt: '2026-08-02 11:20',
    initTimeout: 22,
    maxPrivateMsg: 5,
    listenOn: true,
  },
  {
    id: 'a5',
    nickname: '好物速递',
    gender: '未知',
    letter: '好',
    platform: 'kuaishou',
    agent: '',
    compat: false,
    wxMatch: false,
    createdAt: '2026-07-28 09:05',
    initTimeout: 28,
    maxPrivateMsg: 4,
    listenOn: false,
  },
];

export const mockAgents = [
  '',
  '默认智能体',
  '品牌智能体',
  '售前客服智能体',
  '获客话术智能体',
];

export const mockTasks: MockTask[] = [
  {
    id: 'T20260812001',
    name: '关键词拓客-家居好物',
    typeLabel: '关键词拓客',
    accountName: '小雅来啦',
    platform: 'douyin',
    status: 'running',
    progress: 46,
    completed: 230,
    total: 500,
    createdAt: '2026-08-12 09:30',
    settings: {
      关键词: '家居好物',
      说明: '全平台搜索，非精准筛选',
      地区: '上海市',
      私信数量: '30 条/日',
      私信间隔: '60 秒',
      评论数量: '20 条/日',
      评论间隔: '90 秒',
      触达动作: '私信 + 点赞 + 评论回复',
      隐藏模式: '关闭',
      兼容模式: '关闭',
    },
  },
  {
    id: 'T20260812002',
    name: '对标拓客-竞品A',
    typeLabel: '对标拓客',
    accountName: '品牌官号-01',
    platform: 'douyin',
    status: 'pending',
    progress: 0,
    completed: 0,
    total: 200,
    createdAt: '2026-08-12 10:15',
    settings: {
      对标链接: 'https://v.douyin.com/****competitor',
      关键词: '多少钱, 怎么买, 有链接吗',
      地区: '浙江省',
      私信数量: '30 条/日',
      私信间隔: '60 秒',
      评论数量: '20 条/日',
      评论间隔: '90 秒',
      触达动作: '私信 + 关注',
      隐藏模式: '关闭',
      兼容模式: '开启',
    },
  },
  {
    id: 'T20260812003',
    name: '视频拓客-爆款视频',
    typeLabel: '视频拓客',
    accountName: '小雅来啦',
    platform: 'douyin',
    status: 'success',
    progress: 100,
    completed: 120,
    total: 120,
    createdAt: '2026-08-11 16:20',
    settings: {
      视频链接: '2 条（每行一个）',
      关键词: '多少钱, 求推荐',
      地区: '不限',
      私信数量: '20 条/日',
      私信间隔: '70 秒',
      评论数量: '15 条/日',
      评论间隔: '100 秒',
      触达动作: '私信 + 评论回复 + 点赞',
      隐藏模式: '关闭',
      兼容模式: '关闭',
    },
  },
  {
    id: 'T20260812004',
    name: '直播拓客-品牌直播间',
    typeLabel: '直播拓客',
    accountName: '运营小号-A',
    platform: 'douyin',
    status: 'failed',
    progress: 12,
    completed: 120,
    total: 1000,
    createdAt: '2026-08-11 20:00',
    settings: {
      直播间: 'https://live.douyin.com/****',
      弹幕关键词: '多少钱, 怎么买, 优惠, 链接',
      私信数量: '50 条/日',
      私信间隔: '45 秒',
      触达动作: '私信 + 弹幕回复',
      兼容模式: '开启',
      异常原因: '任务浏览器被手动关闭',
    },
  },
  {
    id: 'T20260812005',
    name: '关键词拓客-护肤测评',
    typeLabel: '关键词拓客',
    accountName: '护肤测评',
    platform: 'xiaohongshu',
    status: 'paused',
    progress: 68,
    completed: 204,
    total: 300,
    createdAt: '2026-08-10 11:00',
    settings: {
      关键词: '护肤测评',
      说明: '全平台搜索，非精准筛选',
      地区: '广东省',
      私信数量: '25 条/日',
      私信间隔: '65 秒',
      评论数量: '15 条/日',
      评论间隔: '90 秒',
      触达动作: '私信 + 点赞 + 评论回复',
      隐藏模式: '关闭',
      兼容模式: '关闭',
    },
  },
  {
    id: 'T20260812006',
    name: '粉丝拓客-沉睡粉丝激活',
    typeLabel: '粉丝拓客',
    accountName: '好物速递',
    platform: 'kuaishou',
    status: 'success',
    progress: 100,
    completed: 80,
    total: 80,
    createdAt: '2026-08-09 15:40',
    settings: {
      来源: '自有粉丝（账号：好物速递）',
      私信比例: '100%（全部选中粉丝）',
      私信间隔: '90 秒',
      私信内容: '预设 · 获客私信（唤醒老粉）',
      触达动作: '私信 + 关注',
      兼容模式: '关闭',
    },
  },
];

export const mockProcesses: MockProcess[] = [
  {
    id: 'P20260813001',
    account: '小雅来啦',
    platform: 'douyin',
    target: '家居好物',
    type: '关键词拓客',
    msg: '是',
    follow: '否',
    like: '是',
    reply: '是',
    createdAt: '2026-08-13 09:30',
  },
  {
    id: 'P20260813002',
    account: '品牌官号-01',
    platform: 'douyin',
    target: '竞品A主页',
    type: '对标拓客',
    msg: '是',
    follow: '是',
    like: '否',
    reply: '否',
    createdAt: '2026-08-13 10:15',
  },
  {
    id: 'P20260813003',
    account: '护肤测评',
    platform: 'xiaohongshu',
    target: '护肤测评',
    type: '关键词拓客',
    msg: '是',
    follow: '否',
    like: '是',
    reply: '是',
    createdAt: '2026-08-12 11:00',
  },
];

export const mockReplyPresets: MockReplyPreset[] = [
  {
    id: 'rp1',
    category: '获客',
    type: '私信',
    content: '您好，这款产品目前活动中，可以私信了解详情~',
    createdAt: '2026-08-10 14:20',
  },
  {
    id: 'rp2',
    category: '获客',
    type: '评论',
    content: '感谢关注，更多案例可以戳我主页哦',
    createdAt: '2026-08-10 14:25',
  },
  {
    id: 'rp3',
    category: '售后',
    type: '私信',
    content: '亲，可以留下您的联系方式，我们安排专员对接',
    createdAt: '2026-08-11 09:10',
  },
];

export const mockKeywordPresets: MockKeywordPreset[] = [
  {
    id: 'kp1',
    name: '意向词',
    keywords: ['多少钱', '怎么买', '有链接吗'],
    createdAt: '2026-08-10 14:00',
  },
  {
    id: 'kp2',
    name: '场景词',
    keywords: ['求推荐', '好用吗', '求分享'],
    createdAt: '2026-08-10 14:05',
  },
  {
    id: 'kp3',
    name: '竞品词',
    keywords: ['某品牌', '别家'],
    createdAt: '2026-08-11 10:30',
  },
];
