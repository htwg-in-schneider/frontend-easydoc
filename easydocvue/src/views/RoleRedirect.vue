<script setup lang="ts">
import { watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import { roleRedirectPath, useProfileStore } from '@/stores/profile'

const router = useRouter()
const { isAuthenticated, isLoading, getAccessTokenSilently, loginWithRedirect } = useAuth0()
const profileStore = useProfileStore()

async function redirectByRole() {
  if (isLoading.value) return

  if (!isAuthenticated.value) {
    await loginWithRedirect({ appState: { target: '/auth/redirect' } })
    return
  }

  const token = await getAccessTokenSilently()
  const profile = await profileStore.load(token, true)
  await router.replace(roleRedirectPath(profile?.role))
}

watch([isLoading, isAuthenticated], redirectByRole, { immediate: true })
</script>

<template>
  <main class="redirect-page">
    <p>Profil wird geladen...</p>
  </main>
</template>

<style scoped>
.redirect-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  color: #64708a;
  background: #eef3fb;
}
</style>
