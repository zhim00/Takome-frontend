import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LibraryView from '@/views/LibraryView.vue'
import RankingsView from '@/views/RankingsView.vue'
import BookDetailView from '@/views/BookDetailView.vue'
import NewsDetailView from '@/views/NewsDetailView.vue'
import ReaderView from '@/views/ReaderView.vue'
import BookshelfView from '@/views/BookshelfView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { setDocumentTitle } from '@/composables/useDocumentTitle'
import { getAuthUser } from '@/services/storage'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '首页' },
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: { title: '书库' },
    },
    {
      path: '/rankings',
      name: 'rankings',
      component: RankingsView,
      meta: { title: '排行榜' },
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: BookDetailView,
      meta: { title: '作品详情' },
    },
    {
      path: '/news/:id',
      name: 'news-detail',
      component: NewsDetailView,
      meta: { title: '资讯详情' },
    },
    {
      path: '/reader/:chapterId',
      name: 'reader',
      component: ReaderView,
      meta: { title: '正在阅读' },
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: BookshelfView,
      meta: { requiresAuth: true, title: '我的书架' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true, title: '个人中心' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: 'home' },
    },
  ],
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getAuthUser()) {
    return { name: 'home' }
  }

  return true
})

router.afterEach((to) => {
  setDocumentTitle(to.meta.title)
})

export default router
