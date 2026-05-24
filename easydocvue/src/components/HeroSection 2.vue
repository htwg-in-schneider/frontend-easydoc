<script setup lang="ts">
import bgImage from '@/assets/images/Background_City.svg'
</script>

<template>
  <div class="background-img" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="ueberschrift">
      <h1>Für ein gesundes Leben!</h1>
    </div>

    <div class="arzt-finden-box">
      <div class="suchfelder">
        <input list="aerzte" placeholder="Arzt suchen">
        <datalist id="aerzte">
          <option value="Lungenarzt" />
          <option value="Zahnarzt" />
          <option value="Hausarzt" />
          <option value="Dermatologe" />
        </datalist>
        <input type="text" placeholder="z. B. Konstanz">
      </div>

      <div class="arzt-finden">
        <router-link to="/doctors">Arzt finden</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.background-img {
  position: relative;
  height: 700px;
  width: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.ueberschrift {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  text-align: center;
  color: white;
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 1), 0 0 20px rgba(0, 0, 0, 1);
}

.arzt-finden-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1000px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.suchfelder {
  display: flex;
  gap: 20px;
  width: 100%;
  justify-content: center;
}

.suchfelder input {
  height: 55px;
  border-radius: 10px;
  width: 400px;
  max-width: 45%;
  border: 1px solid #ccc;
  padding: 0 16px;
  font-size: 16px;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.28);
}

.arzt-finden a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 810px;
  max-width: 90vw;
  height: 60px;
  padding: 0 28px;
  color: #ffffff;
  font-size: 30px;
  font-weight: 700;
  text-decoration: none;
  background: #155dfc;
  border-radius: 10px;
  transition: background 0.3s;
}

.arzt-finden a:hover {
  background: #0f4ad4;
}

@media (max-width: 768px) {
  .background-img {
    height: 500px;
  }

  .ueberschrift {
    font-size: 18px;
  }

  .suchfelder {
    flex-direction: column;
    align-items: center;
  }

  .suchfelder input {
    width: 80%;
    max-width: 80%;
  }

  .arzt-finden a {
    width: 80%;
    font-size: 22px;
    height: 50px;
  }
}
</style>
