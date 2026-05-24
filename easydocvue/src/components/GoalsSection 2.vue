<script setup lang="ts">
import goal1 from '@/assets/images/Goal1.png'
import goal2 from '@/assets/images/Goal2.png'
import goal3 from '@/assets/images/Goal3.png'
import goal4 from '@/assets/images/Goal4.png'

const goals = [
  {
    image: goal1,
    title: 'Schneller Zugang zur passenden Behandlung',
    text: 'Patienten finden in wenigen Sekunden den richtigen Arzt.',
  },
  {
    image: goal2,
    title: 'Effiziente Auslastung für Ärzte',
    text: 'Freie Termine werden sinnvoll vergeben und Leerlauf reduziert.',
  },
  {
    image: goal3,
    title: 'Einfache und intuitive Nutzung',
    text: 'Keine komplizierten Prozesse – einfach suchen, finden, fertig.',
  },
  {
    image: goal4,
    title: 'Bessere Orientierung im Gesundheitssystem',
    text: 'Wir helfen dabei, die richtige Entscheidung zu treffen.',
  },
]
</script>

<template>
  <section class="ziele">
    <h2>Unsere Ziele</h2>

    <div class="ziele-grid">
      <div v-for="(goal, index) in goals" :key="index" class="ziel-card">
        <img :src="goal.image" :alt="goal.title">
        <div>
          <h3>{{ goal.title }}</h3>
          <p>{{ goal.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ziele {
  text-align: center;
  padding: 80px 20px;
}

.ziele h2 {
  font-size: 42px;
  margin-bottom: 50px;
}

.ziele-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.ziel-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: #f8fafc;
  padding: 25px;
  border-radius: 20px;
  text-align: left;
}

.ziel-card img {
  width: 80px;
  flex-shrink: 0;
}

.ziel-card h3 {
  font-size: 22px;
  margin: 0 0 8px;
}

.ziel-card p {
  color: #666;
  font-size: 18px;
  margin: 0;
}

@media (max-width: 768px) {
  .ziele {
    padding: 50px 15px;
  }

  .ziele h2 {
    font-size: 32px;
  }

  .ziele-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .ziel-card {
    max-width: 320px;
    padding: 18px;
    margin: 0 auto;
  }

  .ziel-card img {
    width: 60px;
  }

  .ziel-card h3 {
    font-size: 18px;
  }

  .ziel-card p {
    font-size: 15px;
  }
}
</style>
