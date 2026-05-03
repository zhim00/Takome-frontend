import novelUrl from '@/assets/platforms/novel.png'
import comicUrl from '@/assets/platforms/comic.png'
import writerUrl from '@/assets/platforms/writer.png'
import morePlatformsUrl from '@/assets/platforms/more.png'
import novelIcon from '@/assets/platforms/novelIcon.svg'
import comicIcon from '@/assets/platforms/comicIcon.svg'
import writerIcon from '@/assets/platforms/writerIcon.svg'
import morePlatformsIcon from '@/assets/platforms/moreIcon.svg'
import type { PlatformItem } from '@/types/platform'

export const platforms: PlatformItem[] = [
  {
    title: '小说星港',
    subtitle: 'Novel Harbor',
    desc: '在轻盈的阅读空间里探索奇幻、恋爱、悬疑与冒险。这里为读者聚合连载故事，也为后续书架、榜单和订阅接口预留内容入口。',
    image: novelUrl,
    thumbnail: novelIcon,
  },
  {
    title: '漫画回廊',
    subtitle: 'Comic Gallery',
    desc: '以分镜和色彩连接角色世界。页面保留横向切换结构，适合接入漫画频道、专题推荐、章节列表和作品详情。',
    image: comicUrl,
    thumbnail: comicIcon,
  },
  {
    title: '作家专区',
    subtitle: 'Creator Studio',
    desc: '面向创作者的清爽入口，后续可扩展为投稿、草稿、收益概览和数据看板。当前仅呈现静态导航与视觉状态。',
    image: writerUrl,
    thumbnail: writerIcon,
  },
  {
    title: '更多平台',
    subtitle: 'Coming Soon',
    desc: '持续更新中，敬请期待更多精彩内容。',
    image: morePlatformsUrl,
    thumbnail: morePlatformsIcon,
  },
]

export const defaultPlatform = platforms[0] as PlatformItem
