<script setup lang="ts">
import NavBar from '@/components/NavBar.vue'
import HeroSection from '@/components/HeroSection.vue'
import GoalsSection from '@/components/GoalsSection.vue'
import ContactForm from '@/components/ContactForm.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<template>
  <div class="home-page">
    <NavBar />
    <HeroSection />
    <GoalsSection />
    <ContactForm />
    <AppFooter />
  </div>
</template>

<style scoped>
.home-page {
  background: #ffffff;
}
</style>
