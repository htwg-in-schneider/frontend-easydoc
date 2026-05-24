<script setup lang="ts">
import MainPopup from '@/components/MainPopup.vue'
</script>

<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
    <MainPopup />
  </v-app>
</template>
