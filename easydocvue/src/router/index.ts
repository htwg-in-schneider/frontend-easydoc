import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import DoctorCatalog from '@/views/DoctorCatalog.vue'
import DoctorDetail from '@/views/DoctorDetail.vue'
import CreateDoctor from '@/views/CreateDoctor.vue'
import EditDoctor from '@/views/EditDoctor.vue'
import Booking from '@/views/Booking.vue'
import SlotSelection from '@/views/SlotSelection.vue'
import BookingConfirmation from '@/views/BookingConfirmation.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/doctors', component: DoctorCatalog },
  {
    path: '/doctor/view/:id',
    name: 'doctor',
    component: DoctorDetail,
  },
  { path: '/doctor/create', component: CreateDoctor },
  { path: '/doctor/edit/:id', name: 'doctor-edit', component: EditDoctor },
  { path: '/booking', component: Booking },
  { path: '/slot-selection', component: SlotSelection },
  { path: '/booking-confirmation', component: BookingConfirmation },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
