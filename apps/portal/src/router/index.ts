import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PlatformPlaceholderView from '@/views/PlatformPlaceholderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/novel',
      name: 'novel',
      component: PlatformPlaceholderView,
      props: {
        title: 'Takome书屋',
      },
    },
    {
      path: '/comic',
      name: 'comic',
      component: PlatformPlaceholderView,
      props: {
        title: 'Takome漫画',
      },
    },
    {
      path: '/writer',
      name: 'writer',
      component: PlatformPlaceholderView,
      props: {
        title: '作家专区',
      },
    },
  ],
})

export default router
