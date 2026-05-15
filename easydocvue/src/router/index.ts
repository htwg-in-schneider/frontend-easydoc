import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import DoctorCatalog from '@/views/DoctorCatalog.vue'
import DoctorDetail from '@/views/DoctorDetail.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/doctors', component: DoctorCatalog },
  {
    path: '/doctor/view/:id',
    name: 'doctor',
    component: DoctorDetail,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
