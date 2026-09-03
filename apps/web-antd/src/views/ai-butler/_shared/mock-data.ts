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
