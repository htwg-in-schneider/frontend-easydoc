<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useDoctorStore, type AvailabilityRule } from '@/stores/doctors'
import { useProfileStore } from '@/stores/profile'
import { usePopupStore } from '@/stores/popup'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const doctorStore = useDoctorStore()
const profileStore = useProfileStore()
const popup = usePopupStore()
const { profile } = storeToRefs(profileStore)
const { getAccessTokenSilently } = useAuth0()

const loading = ref(true)
const saving = ref(false)
const rules = ref<AvailabilityRule[]>([])

const weekdays = [
  { key: 'MONDAY', label: 'Montag' },
  { key: 'TUESDAY', label: 'Dienstag' },
  { key: 'WEDNESDAY', label: 'Mittwoch' },
  { key: 'THURSDAY', label: 'Donnerstag' },
  { key: 'FRIDAY', label: 'Freitag' },
  { key: 'SATURDAY', label: 'Samstag' },
  { key: 'SUNDAY', label: 'Sonntag' },
]

function defaultRule(dayOfWeek: string): AvailabilityRule {
  const enabled = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(dayOfWeek)
  return {
    dayOfWeek,
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    bufferMinutes: 10,
    enabled,
  }
}

async function loadRules() {
  loading.value = true
  try {
    const token = await getAccessTokenSilently()
    await profileStore.load(token)
    const currentDoctorId = profile.value?.id ?? null

    if (!currentDoctorId) {
      rules.value = weekdays.map((day) => defaultRule(day.key))
      return
    }

    const data = await doctorStore.getAvailabilityRules(currentDoctorId, token)

    const ruleMap = new Map(data.map((rule) => [rule.dayOfWeek, rule]))
    rules.value = weekdays.map((day) => ruleMap.get(day.key) ?? defaultRule(day.key))
  } finally {
    loading.value = false
  }
}

async function saveRules() {
  saving.value = true
  try {
    const token = await getAccessTokenSilently()
    const currentDoctorId = profile.value?.id
    if (!currentDoctorId) return

    for (let index = 0; index < rules.value.length; index += 1) {
      const rule = rules.value[index]
      const saved = await doctorStore.saveAvailabilityRule(currentDoctorId, {
        ...rule,
        doctorId: currentDoctorId,
      }, token)
      rules.value[index] = saved
    }

    await popup.showMessage({
      title: 'Gespeichert',
      message: 'Die Verfügbarkeiten wurden aktualisiert.',
      variant: 'success',
    })
  } catch (error) {
    await popup.showMessage({
      title: 'Speichern fehlgeschlagen',
      message: error instanceof Error ? error.message : 'Die Verfügbarkeiten konnten nicht gespeichert werden.',
      variant: 'danger',
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadRules()
})
</script>

<template>
  <NavBar />
  <main class="dashboard-page">
    <section class="dashboard-card">
      <header class="dashboard-header">
        <div>
          <h1>Verfügbarkeit</h1>
          <p>Wöchentliche Sprechzeiten für freie Terminplätze.</p>
        </div>
        <button class="btn btn-primary" type="button" :disabled="saving || loading" @click="saveRules">
          {{ saving ? 'Speichern...' : 'Alle Änderungen speichern' }}
        </button>
      </header>

      <div v-if="loading" class="message">Verfügbarkeiten werden geladen...</div>

      <div v-else class="rule-table">
        <div class="rule-row rule-head">
          <span>Tag</span>
          <span>Aktiv</span>
          <span>Von</span>
          <span>Bis</span>
          <span>Dauer</span>
          <span>Puffer</span>
        </div>

        <div v-for="(rule, index) in rules" :key="rule.dayOfWeek" class="rule-row">
          <strong>{{ weekdays[index].label }}</strong>
          <label class="switch">
            <input v-model="rule.enabled" type="checkbox">
            <span></span>
          </label>
          <input v-model="rule.startTime" type="time">
          <input v-model="rule.endTime" type="time">
          <input v-model.number="rule.slotDurationMinutes" type="number" min="5" step="5">
          <input v-model.number="rule.bufferMinutes" type="number" min="0" step="5">
        </div>
      </div>
    </section>
  </main>
  <AppFooter />
</template>

<style scoped>
.dashboard-page {
  min-height: calc(100vh - 75px - 180px);
  padding: 56px 20px;
  background: linear-gradient(180deg, #f6f8fc 0%, #eef3fb 100%);
}

.dashboard-card {
  width: min(960px, 100%);
  margin: 0 auto;
  padding: 28px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 22px;
}

.dashboard-header h1 {
  margin: 0 0 8px;
  color: #1f2a44;
  font-size: 28px;
}

.dashboard-header p {
  margin: 0;
  color: #64708a;
}

.rule-table {
  display: grid;
  gap: 10px;
}

.rule-row {
  display: grid;
  grid-template-columns: 1.4fr 90px repeat(4, minmax(92px, 1fr));
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #e3ebf7;
  border-radius: 10px;
}

.rule-head {
  background: #f8fbff;
  font-size: 13px;
  color: #64708a;
  text-transform: uppercase;
  letter-spacing: 0;
}

.rule-row input[type='time'],
.rule-row input[type='number'] {
  width: 100%;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #c9d7ef;
  border-radius: 8px;
  background: #fff;
}

.switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 46px;
  height: 26px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch span {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: #d8e3f7;
  transition: 0.2s;
}

.switch span::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  left: 3px;
  top: 3px;
  border-radius: 50%;
  background: #fff;
  transition: 0.2s;
}

.switch input:checked + span {
  background: #155dfc;
}

.switch input:checked + span::after {
  transform: translateX(20px);
}

.btn {
  height: 44px;
  padding: 0 22px;
  border: 0;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.btn-primary {
  color: #ffffff;
  background: #155dfc;
}

.message {
  padding: 28px 0;
  color: #64708a;
  text-align: center;
}

@media (max-width: 900px) {
  .rule-row {
    grid-template-columns: 1fr 90px 1fr 1fr;
  }

  .rule-head {
    display: none;
  }
}

@media (max-width: 640px) {
  .dashboard-header {
    flex-direction: column;
  }

  .rule-row {
    grid-template-columns: 1fr;
  }
}
</style>
