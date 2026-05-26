import { createRouter, createWebHistory } from 'vue-router'
import { authGuard } from '@auth0/auth0-vue'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import DoctorCatalog from '@/views/DoctorCatalog.vue'
import MapDoctors from '@/views/MapDoctors.vue'
import DoctorDetail from '@/views/DoctorDetail.vue'
import CreateDoctor from '@/views/CreateDoctor.vue'
import EditDoctor from '@/views/EditDoctor.vue'
import Booking from '@/views/Booking.vue'
import SlotSelection from '@/views/SlotSelection.vue'
import BookingConfirmation from '@/views/BookingConfirmation.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/doctors', component: DoctorCatalog },
  { path: '/doctors/map', component: MapDoctors },
  {
    path: '/doctor/view/:id',
    name: 'doctor',
    component: DoctorDetail,
  },
  { path: '/doctor/create', component: CreateDoctor, beforeEnter: authGuard },
  { path: '/doctor/edit/:id', name: 'doctor-edit', component: EditDoctor, beforeEnter: authGuard },
  { path: '/booking/:id', name: 'booking', component: Booking },
  { path: '/slot-selection', component: SlotSelection },
  { path: '/booking-confirmation', component: BookingConfirmation },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
