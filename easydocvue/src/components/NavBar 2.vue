<script setup lang="ts">
import logo from '@/assets/images/Logo.png'
import flagge from '@/assets/images/DeutschlandFlagge.png'
</script>

<template>
  <nav class="navigation">
    <router-link to="/">
      <img class="logo" :src="logo" alt="EasyDoc Logo">
    </router-link>

    <div class="nav-links">
      <router-link class="nav-link" to="/">Startseite</router-link>
      <router-link class="nav-link" to="/doctors">Ärzte</router-link>
    </div>

    <div class="nav-right">
      <div class="anmelden">
        <a href="#">Anmelden</a>
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

.anmelden a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 140px;
  height: 45px;
  padding: 0 24px;
  color: #ffffff;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
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

  .anmelden a {
    min-width: 110px;
    height: 38px;
    font-size: 16px;
    padding: 0 16px;
  }
}
</style>
