import type { Book, Category, Chapter, FeedbackItem, NewsItem } from './types'

const mockBookDescriptions = [
  '旧城下着细雨，少年在废弃书楼里翻到一卷没有署名的手稿，从此每一次阅读都会改变现实的一处细节。',
  '她在星港档案馆整理失落航线，却发现所有被删除的坐标都指向同一片沉默的海。',
  '一座山门只收失败者，所有弟子都背着未完成的誓言，却在乱世里练成了最温柔的剑。',
  '午夜电台只播未来新闻，出租车司机每晚接到不同年代的乘客，逐渐拼出城市消失前的真相。',
  '被放逐的宫廷画师以画像换取记忆，在第九十九幅画里看见了自己从未经历过的人生。',
  '荒原上的移动剧院每七天停靠一座城，观众以秘密买票，演员则用谎言维持最后的文明。',
]

const fallbackDescription = '这是一段用于演示的作品简介，用来保证接口为空时核心阅读流程仍然可用。'
const fallbackCategory: Category = { id: '0', name: '未分类' }

export const mockCategories: Category[] = [
  { id: '1', name: '玄幻奇幻' },
  { id: '2', name: '武侠仙侠' },
  { id: '3', name: '都市言情' },
  { id: '4', name: '历史军事' },
  { id: '5', name: '科幻灵异' },
  { id: '6', name: '网游竞技' },
  { id: '7', name: '女生频道' },
]

export const fallbackBook: Book = {
  id: '9000',
  categoryId: fallbackCategory.id,
  categoryName: fallbackCategory.name,
  cover: '',
  title: '雾灯书局',
  author: 'Takome',
  description: fallbackDescription,
  status: 'serial',
  visits: 12000,
  words: 240000,
  comments: 0,
  firstChapterId: '9000-1',
  lastChapterId: '9000-8',
  lastChapterName: '第 8 章 风从纸页背面吹来',
  updatedAt: '2026-05-25',
  source: 'mock',
}

export const mockBooks: Book[] = Array.from({ length: 24 }, (_, index) => {
  const category = mockCategories[index % mockCategories.length] ?? fallbackCategory
  const id = String(9000 + index)

  return {
    id,
    categoryId: category.id,
    categoryName: category.name,
    cover: '',
    title:
      [
        '雾灯书局',
        '星港旧事',
        '南山无名剑',
        '午夜城市电台',
        '第九十九幅画',
        '荒原移动剧院',
      ][index % 6] ?? '未命名故事',
    author: ['林见川', '洛青砚', '许长昼', '沈知微'][index % 4] ?? 'Takome',
    description: mockBookDescriptions[index % mockBookDescriptions.length] ?? fallbackDescription,
    status: index % 4 === 0 ? 'finished' : 'serial',
    visits: 12000 + index * 839,
    words: 240000 + index * 17321,
    comments: index * 3,
    firstChapterId: `${id}-1`,
    lastChapterId: `${id}-8`,
    lastChapterName: `第 ${8 + index} 章 风从纸页背面吹来`,
    updatedAt: `2026-05-${String(25 - (index % 20)).padStart(2, '0')}`,
    source: 'mock',
  }
})

export function createMockChapters(bookId: string): Chapter[] {
  return Array.from({ length: 18 }, (_, index) => ({
    id: `${bookId}-${index + 1}`,
    bookId,
    order: index + 1,
    title:
      index === 0
        ? '第一章 雨落在未拆封的信上'
        : `第 ${index + 1} 章 ${['旧钥匙', '灯塔', '远行者', '回声', '无名页'][index % 5]}`,
    words: 3200 + index * 180,
    updatedAt: `2026-05-${String(10 + (index % 16)).padStart(2, '0')}`,
    isVip: false,
    source: 'mock',
  }))
}

export function createMockContent(book: Book, chapter: Chapter) {
  return [
    `${chapter.title}`,
    '',
    `　　${book.description}`,
    '',
    '　　窗外的雨声像被压低的掌声，整座城市在傍晚慢慢收起锋芒。主角把书页翻到折角处，看见一行并不属于自己的批注：真正的入口，总是藏在最普通的门后。',
    '',
    '　　他沿着长街走到尽头，纸灯在檐下微微晃动。每一家店铺都像刚刚结束一场漫长的等待，门缝里透出温热的光。有人在远处喊他的名字，声音却像来自多年以后。',
    '',
    '　　故事从这里继续。没有宏大的宣告，也没有突然降临的奇迹，只有一页接一页的选择，把普通的一天推向无法回头的方向。',
  ].join('\n')
}

export const mockNews: NewsItem[] = [
  {
    id: 'mock-news-1',
    title: '沉浸式阅读正在回到长篇内容的中心',
    category: '行业',
    sourceName: 'Takome 编辑部',
    updatedAt: '2026-05-20',
    content: '轻量导航、可调字号和低干扰视觉，正在成为阅读平台的基础体验。',
    source: 'mock',
  },
  {
    id: 'mock-news-2',
    title: '本周读者更偏爱慢节奏奇幻与城市悬疑',
    category: '榜单',
    sourceName: 'Takome 数据观察',
    updatedAt: '2026-05-18',
    content: '更新稳定、角色关系清晰的作品获得更多收藏。',
    source: 'mock',
  },
  {
    id: 'mock-news-3',
    title: '移动端阅读页新增纸感背景实验',
    category: '产品',
    sourceName: 'Takome 产品组',
    updatedAt: '2026-05-16',
    content: '纸感背景与夜间模式会继续围绕长时间阅读舒适度迭代。',
    source: 'mock',
  },
  {
    id: 'mock-news-4',
    title: '评论区治理：每本书首评更重视内容质量',
    category: '社区',
    sourceName: 'Takome 社区',
    updatedAt: '2026-05-12',
    content: '单书单评和可回复机制能让讨论更集中。',
    source: 'mock',
  },
  {
    id: 'mock-news-5',
    title: '新书库筛选将优先优化分类和连载状态',
    category: '产品',
    sourceName: 'Takome 产品组',
    updatedAt: '2026-05-08',
    content: '分类筛选、排序和分页会保持轻量，不打断找书节奏。',
    source: 'mock',
  },
  {
    id: 'mock-news-6',
    title: '读者书架更强调最近阅读而非单纯收藏',
    category: '观察',
    sourceName: 'Takome 编辑部',
    updatedAt: '2026-05-02',
    content: '最近阅读记录不要求先收藏，适合快速回到上一次停留处。',
    source: 'mock',
  },
]

export const mockFeedback: FeedbackItem[] = [
  {
    id: 'feedback-seed-1',
    content: '希望阅读页保留上次选择的字号。',
    createdAt: '2026-05-21T10:00:00.000Z',
    reply: '已纳入阅读设置本地持久化。',
    source: 'mock',
  },
]
