<script setup lang="ts">
import MainPopup from '@/components/MainPopup.vue'
</script>

<template>
  <v-app>
    <v-main>
      <router-view v-slot="{ Component, route }">
        <Transition name="route-fade" appear>
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </v-main>
    <MainPopup />
  </v-app>
</template>

<style scoped>
:global(.route-fade-enter-active),
:global(.route-fade-leave-active) {
  transition: opacity 120ms ease;
}

:global(.route-fade-enter-from),
:global(.route-fade-leave-to) {
  opacity: 0;
}

:global(.route-fade-enter-to),
:global(.route-fade-leave-from) {
  opacity: 1;
}
</style>
