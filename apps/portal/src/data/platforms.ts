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
    id: 'novel',
    title: 'Takome书屋',
    subtitle: 'Takome Novel',
    desc: '面向网文热爱者的免费阅读产品，致力于为读者提供畅快不花钱的极致阅读体验。',
    image: novelUrl,
    thumbnail: novelIcon,
    enterButtonLabel: '立即进入',
    entryRoute: '/novel/',
    disabled: false,
  },
  {
    id: 'comic',
    title: 'Takome漫画',
    subtitle: 'Takome Comic',
    desc: '免费漫画阅读平台, 海量官方漫画连载在线观看, 二次元动漫迷的追漫神器。',
    image: comicUrl,
    thumbnail: comicIcon,
    enterButtonLabel: '立即进入',
    entryRoute: '/comic',
    disabled: true,
  },
  {
    id: 'writer',
    title: '作家专区',
    subtitle: 'Creator Studio',
    desc: '创作者专区，提供一站式的创作、发布和交流服务，致力于让好故事影响更多人。',
    image: writerUrl,
    thumbnail: writerIcon,
    enterButtonLabel: '立即进入',
    entryRoute: '/writer',
    disabled: true,
  },
  {
    id: 'more',
    title: '更多平台',
    subtitle: 'Coming Soon',
    desc: '持续更新中，敬请期待更多精彩内容。',
    image: morePlatformsUrl,
    thumbnail: morePlatformsIcon,
    enterButtonLabel: '敬请期待',
    disabled: true,
  },
]

export const defaultPlatform = platforms[0] as PlatformItem
