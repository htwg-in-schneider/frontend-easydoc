<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/stores/profile'
import logo from '@/assets/images/Logo.png'
import flagge from '@/assets/images/DeutschlandFlagge.png'

const { loginWithRedirect, logout, isAuthenticated, user, getAccessTokenSilently } = useAuth0()
const profileStore = useProfileStore()
const { profile, isAdmin, isDoctor, isUser } = storeToRefs(profileStore)
const appointmentsLabel = computed(() => (isAdmin.value ? 'Alle Termine' : 'Meine Termine'))
const isMenuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

const profilePicture = computed(() => profile.value?.imageUrl || user.value?.picture)
const fallbackInitial = computed(() => {
  const name = profile.value?.firstName || user.value?.name || user.value?.email || 'U'
  return name.charAt(0).toUpperCase()
})

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function handleLogin() {
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

watch(isAuthenticated, async (authenticated) => {
  if (!authenticated) {
    profileStore.clear()
    return
  }

  try {
    const token = await getAccessTokenSilently()
    await profileStore.load(token, true)
  } catch (error) {
    console.error('Profile loading failed', error)
  }
}, { immediate: true })
</script>

<template>
  <nav class="navigation">
    <router-link to="/">
      <img class="logo" :src="logo" alt="EasyDoc Logo">
    </router-link>

    <div class="nav-links">
      <router-link class="nav-link" to="/">Startseite</router-link>
      <template v-if="isAdmin">
        <router-link class="nav-link" to="/Benutzerverwaltung">Benutzer</router-link>
        <router-link class="nav-link" to="/my-bookings">{{ appointmentsLabel }}</router-link>
        <router-link class="nav-link" to="/admin/revenue">Umsatz</router-link>
      </template>
      <template v-else-if="isDoctor">
        <router-link class="nav-link" to="/my-bookings">{{ appointmentsLabel }}</router-link>
        <router-link class="nav-link" to="/doctor/dashboard">Kalender</router-link>
      </template>
      <template v-else-if="isUser">
        <router-link class="nav-link" to="/doctors/map">Arzt finden</router-link>
        <router-link class="nav-link" to="/my-bookings">{{ appointmentsLabel }}</router-link>
      </template>
      <router-link class="nav-link" to="/symptom-analysis">Symptomanalyse</router-link>
    </div>

    <div class="nav-right">
      <div v-if="!isAuthenticated" class="anmelden">
        <button type="button" class="auth-btn" @click="handleLogin">Anmelden</button>
      </div>

      <div v-else ref="menuRef" class="profile-menu">
        <button
          type="button"
          class="avatar-button"
          aria-label="Profilmenü"
          :aria-expanded="isMenuOpen"
          @click.stop="toggleMenu"
        >
          <img v-if="profilePicture" class="avatar-image" :src="profilePicture" alt="Profilbild">
          <span v-else class="avatar-fallback">{{ fallbackInitial }}</span>
        </button>

        <div v-if="isMenuOpen" class="profile-dropdown">
          <router-link class="dropdown-item" to="/profile" @click="closeMenu">Profil</router-link>
          <template v-if="isAdmin">
            <router-link class="dropdown-item" to="/Benutzerverwaltung" @click="closeMenu">Benutzer</router-link>
            <router-link class="dropdown-item" to="/my-bookings" @click="closeMenu">{{ appointmentsLabel }}</router-link>
            <router-link class="dropdown-item" to="/admin/revenue" @click="closeMenu">Umsatz</router-link>
          </template>
          <template v-else-if="isDoctor">
            <router-link class="dropdown-item" to="/doctor/dashboard" @click="closeMenu">Kalender</router-link>
            <router-link class="dropdown-item" to="/my-bookings" @click="closeMenu">{{ appointmentsLabel }}</router-link>
          </template>
          <template v-else-if="isUser">
            <router-link class="dropdown-item" to="/my-bookings" @click="closeMenu">{{ appointmentsLabel }}</router-link>
          </template>
          <button type="button" class="dropdown-item dropdown-button" @click="handleLogout">Abmelden</button>
        </div>
      </div>

      <div class="sprache">
        <a href="#">
          <img class="flagge" :src="flagge" alt="Sprache">
        </a>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navigation {
  display: flex;
  height: 75px;
  max-height: 75px;
  flex-direction: row;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
}

.logo {
  height: 70px;
  width: 70px;
}

.nav-links {
  display: flex;
  gap: 24px;
  margin-left: 32px;
}

.nav-link {
  text-decoration: none;
  color: #333;
  font-size: 18px;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: #155dfc;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.anmelden {
  background: #155dfc;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.28);
  border-radius: 20px;
}

.anmelden .auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  height: 45px;
  padding: 0 24px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
}

.anmelden .auth-btn:hover {
  opacity: 0.9;
}

.profile-menu {
  position: relative;
}

.avatar-button {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
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
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #155dfc;
  font-size: 18px;
  font-weight: 700;
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 20;
  min-width: 180px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(24, 58, 150, 0.18);
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
  border-radius: 6px;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #eef3fb;
  color: #155dfc;
}

.flagge {
  height: 30px;
  width: 45px;
}

@media (max-width: 768px) {
  .navigation {
    height: auto;
    padding: 10px;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .logo {
    height: 50px;
    width: 50px;
  }

  .nav-links {
    margin-left: 0;
    gap: 16px;
  }

  .anmelden .auth-btn {
    min-width: 110px;
    height: 38px;
    font-size: 16px;
    padding: 0 16px;
  }
}
</style>
