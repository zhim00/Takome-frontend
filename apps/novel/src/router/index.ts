import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LibraryView from '@/views/LibraryView.vue'
import RankingsView from '@/views/RankingsView.vue'
import BookDetailView from '@/views/BookDetailView.vue'
import ReaderView from '@/views/ReaderView.vue'
import BookshelfView from '@/views/BookshelfView.vue'
import ProfileView from '@/views/ProfileView.vue'
import { getAuthUser } from '@/services/storage'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
    },
    {
      path: '/rankings',
      name: 'rankings',
      component: RankingsView,
    },
    {
      path: '/books/:id',
      name: 'book-detail',
      component: BookDetailView,
    },
    {
      path: '/reader/:chapterId',
      name: 'reader',
      component: ReaderView,
    },
    {
      path: '/bookshelf',
      name: 'bookshelf',
      component: BookshelfView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
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

export default router
