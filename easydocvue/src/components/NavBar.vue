<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import logo from '@/assets/images/Logo.png'

type NavItem = {
  label: string
  to: string
}

const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0()
const route = useRoute()
const profileStore = useProfileStore()
const { profile, isAdmin, isDoctor, isUser } = storeToRefs(profileStore)

const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const profilePicture = computed(() => profile.value?.imageUrl || user.value?.picture)
const fallbackInitial = computed(() => {
  const name = profile.value?.firstName || user.value?.name || user.value?.email || 'E'
  return name.charAt(0).toUpperCase()
})

const appointmentsLabel = computed(() => (isAdmin.value ? 'Alle Termine' : 'Meine Termine'))

const desktopNavItems = computed<NavItem[]>(() => {
  if (isAdmin.value) {
    return [
      { label: 'Benutzer', to: '/Benutzerverwaltung' },
      { label: 'Arzt finden', to: '/doctors/map' },
      { label: appointmentsLabel.value, to: '/my-bookings' },
      { label: 'Umsatz', to: '/admin/revenue' },
      { label: 'Symptomanalyse', to: '/symptom-analysis' },
    ]
  }

  if (isDoctor.value) {
    return [
      { label: appointmentsLabel.value, to: '/my-bookings' },
      { label: 'Verfügbarkeit', to: '/doctor/dashboard' },
      { label: 'Symptomanalyse', to: '/symptom-analysis' },
    ]
  }

  if (isUser.value) {
    return [
      { label: 'Arzt finden', to: '/doctors/map' },
      { label: appointmentsLabel.value, to: '/my-bookings' },
      { label: 'Symptomanalyse', to: '/symptom-analysis' },
    ]
  }

  return [{ label: 'Symptomanalyse', to: '/symptom-analysis' }]
})

const mobileNavItems = computed(() => desktopNavItems.value)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleLogin() {
  closeMenu()
  loginWithRedirect({ appState: { target: '/auth/redirect' } })
}

function handleLogout() {
  closeMenu()
  profileStore.clear()
  logout({ logoutParams: { returnTo: window.location.origin + import.meta.env.BASE_URL } })
}

function onDocumentClick(event: MouseEvent) {
  if (!menuRef.value || !(event.target instanceof Node)) return
  if (!menuRef.value.contains(event.target)) closeMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

watch(
  isAuthenticated,
  async (authenticated) => {
    if (!authenticated) {
      profileStore.clear()
      closeMenu()
      return
    }

    try {
      const token = await getAccessTokenSilently()
      await profileStore.load(token, true)
    } catch (error) {
      console.error('Profile loading failed', error)
    }
  },
  { immediate: true },
)

watch(
  () => route.fullPath,
  () => {
    closeMenu()
  },
)
</script>

<template>
  <nav class="navigation">
    <router-link class="brand-link" to="/" aria-label="EasyDoc Startseite">
      <img class="logo" :src="logo" alt="EasyDoc Logo">
    </router-link>

    <div class="nav-links">
      <router-link
        v-for="item in desktopNavItems"
        :key="item.to"
        class="nav-link"
        :to="item.to"
      >
        {{ item.label }}
      </router-link>
    </div>

    <div class="nav-right">
      <template v-if="!isAuthenticated">
        <button type="button" class="auth-btn desktop-login" @click="handleLogin">
          Anmelden
        </button>
      </template>

      <div ref="menuRef" class="profile-menu">
        <button
          v-if="isAuthenticated"
          type="button"
          class="avatar-button"
          aria-label="Profilmenü"
          :aria-expanded="isMenuOpen"
          @click.stop="toggleMenu"
        >
          <img v-if="profilePicture" class="avatar-image" :src="profilePicture" alt="Profilbild">
          <span v-else class="avatar-fallback">{{ fallbackInitial }}</span>
        </button>

        <button
          v-else
          type="button"
          class="avatar-button guest-trigger mobile-menu-trigger"
          aria-label="Menü öffnen"
          :aria-expanded="isMenuOpen"
          @click.stop="toggleMenu"
        >
          <span class="avatar-fallback">ED</span>
        </button>

        <Transition name="menu-fade">
          <div v-if="isMenuOpen" class="profile-dropdown">
            <div class="dropdown-section desktop-only">
              <router-link class="dropdown-item" to="/profile" @click="closeMenu">Profil</router-link>
              <button type="button" class="dropdown-item dropdown-button" @click="handleLogout">
                Abmelden
              </button>
            </div>

            <div class="dropdown-section mobile-only">
            <template v-if="isAuthenticated">
              <router-link
                v-for="item in mobileNavItems"
                :key="`mobile-${item.to}`"
                class="dropdown-item"
                :to="item.to"
                @click="closeMenu"
              >
                {{ item.label }}
              </router-link>

              <router-link class="dropdown-item" to="/profile" @click="closeMenu">Profil</router-link>

              <button type="button" class="dropdown-item dropdown-button" @click="handleLogout">
                Abmelden
              </button>
            </template>
            <template v-else>
              <router-link
                v-for="item in mobileNavItems"
                :key="`guest-mobile-${item.to}`"
                class="dropdown-item"
                :to="item.to"
                @click="closeMenu"
              >
                {{ item.label }}
              </router-link>

              <button type="button" class="dropdown-item dropdown-button" @click="handleLogin">
                Anmelden
              </button>
            </template>
          </div>
          </div>
        </Transition>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 76px;
  padding: 0 20px;
  background: #fff;
}

.brand-link {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-right: auto;
  margin-left: 26px;
  min-width: 0;
}

.nav-link {
  color: #333;
  font-size: 18px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: #155dfc;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
  flex-shrink: 0;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  height: 44px;
  padding: 0 22px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  background: #155dfc;
  border: none;
  border-radius: 20px;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.22);
  cursor: pointer;
}

.auth-btn:hover {
  opacity: 0.92;
}

.profile-menu {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.avatar-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  overflow: hidden;
  color: #155dfc;
  background: #eef3fb;
  border: 2px solid #d8e3f7;
  border-radius: 50%;
  cursor: pointer;
}

.avatar-button:hover {
  border-color: #155dfc;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 16px;
  font-weight: 800;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  min-width: 220px;
  max-width: min(320px, calc(100vw - 24px));
  max-height: calc(100vh - 96px);
  padding: 8px;
  overflow: auto;
  background: #fff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 16px 32px rgba(24, 58, 150, 0.16);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.dropdown-section {
  display: flex;
  flex-direction: column;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 10px 12px;
  color: #26334d;
  font: inherit;
  font-size: 15px;
  text-align: left;
  text-decoration: none;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #eef3fb;
  color: #155dfc;
}

.dropdown-button {
  appearance: none;
}

.desktop-only {
  display: flex;
}

.mobile-only {
  display: none;
}

.mobile-menu-trigger {
  display: none;
}

@media (max-width: 1100px) {
  .navigation {
    gap: 12px;
    padding: 0 16px;
  }

  .logo {
    width: 56px;
    height: 56px;
  }

  .nav-links {
    display: none;
  }

  .desktop-login {
    display: none;
  }

  .mobile-menu-trigger {
    display: inline-flex;
  }

  .profile-dropdown {
    min-width: 240px;
  }

  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: flex;
  }
}

@media (max-width: 640px) {
  .navigation {
    gap: 10px;
    padding: 0 12px;
  }

  .nav-right {
    gap: 10px;
  }

  .avatar-button {
    width: 42px;
    height: 42px;
  }

  .profile-dropdown {
    right: 0;
    min-width: 210px;
  }
}
</style>
