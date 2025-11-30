import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import SearchResults from '../views/SearchResults.vue'
import Discover from '../views/Discover.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/results',
    name: 'SearchResults',
    component: SearchResults
  },
  {
    path: '/discover',
    name: 'Discover',
    component: Discover
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
