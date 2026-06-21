<script setup lang="ts">
import { reactive } from 'vue'
import contactImage from '@/assets/images/Kontkatausfnahme.png'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const contactItems = [
  {
    icon: 'mdi-email-outline',
    label: 'E-Mail',
    value: 'info@easydoc.de',
  },
  {
    icon: 'mdi-phone-outline',
    label: 'Telefon',
    value: '+49 123 456 7890',
  },
  {
    icon: 'mdi-clock-outline',
    label: 'Antwortzeit',
    value: 'Mo - Fr: 08:00 - 18:00 Uhr',
  },
]

function sendMail() {
  const subject = encodeURIComponent(form.subject)
  const body = encodeURIComponent(
    `Name: ${form.name}\nE-Mail: ${form.email}\n\n${form.message}`,
  )

  window.location.href = `mailto:info@easydoc.de?subject=${subject}&body=${body}`
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
}
</script>

<template>
  <section class="contact-section">
    <div class="contact-shell">
      <div class="contact-panel contact-info">
        <div class="contact-image-wrap">
          <img :src="contactImage" alt="Support Team" class="contact-image" loading="lazy" decoding="async">
        </div>

        <div class="contact-copy">
          <span class="section-kicker">Haben Sie Fragen?</span>
          <h2>Wir sind für Sie da.</h2>
          <p>
            Unser Team unterstützt Sie gerne persönlich bei allen Anliegen rund um EasyDoc.
          </p>

          <div class="contact-items">
            <div v-for="item in contactItems" :key="item.label" class="contact-item">
              <div class="contact-item-icon">
                <v-icon size="20" :icon="item.icon" />
              </div>
              <div class="contact-item-text">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form class="contact-panel contact-form" @submit.prevent="sendMail">
        <div class="form-row">
          <div class="form-group">
            <label for="contact-name">Ihr Name</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              placeholder="Ihr Name"
              required
            />
          </div>

          <div class="form-group">
            <label for="contact-email">E-Mail-Adresse</label>
            <input
              id="contact-email"
              v-model="form.email"
              type="email"
              placeholder="ihre@email.de"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="contact-subject">Betreff</label>
          <input
            id="contact-subject"
            v-model="form.subject"
            type="text"
            placeholder="Worum geht es?"
            required
          />
        </div>

        <div class="form-group">
          <label for="contact-message">Nachricht</label>
          <textarea
            id="contact-message"
            v-model="form.message"
            placeholder="Ihre Nachricht..."
            rows="8"
            required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">
          Nachricht senden
          <v-icon size="18">mdi-send</v-icon>
        </button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact-section {
  padding: 0 24px 96px;
}

.contact-shell {
  display: grid;
  grid-template-columns: minmax(0, 0.98fr) minmax(0, 1.02fr);
  gap: 28px;
  max-width: 1440px;
  margin: 0 auto;
}

.contact-panel {
  padding: 24px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(216, 227, 247, 0.92);
  border-radius: 28px;
  box-shadow: 0 24px 54px rgba(24, 58, 150, 0.1);
}

.contact-info {
  display: grid;
  grid-template-columns: minmax(190px, 240px) minmax(0, 1fr);
  gap: 22px;
  align-items: center;
  background: linear-gradient(180deg, rgba(246, 249, 255, 0.98) 0%, rgba(240, 246, 255, 0.96) 100%);
}

.contact-image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-image {
  width: 100%;
  max-width: 235px;
  aspect-ratio: 0.84 / 1;
  object-fit: cover;
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(24, 58, 150, 0.14);
}

.contact-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-kicker {
  display: inline-flex;
  color: #155dfc;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.contact-copy h2 {
  margin: 0;
  color: #13213c;
  font-size: clamp(1.9rem, 2.4vw, 2.9rem);
  line-height: 1.08;
  letter-spacing: -0.035em;
}

.contact-copy p {
  margin: 0;
  color: #5d6a82;
  font-size: 16px;
  line-height: 1.7;
}

.contact-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 6px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  color: #155dfc;
  background: #eef4ff;
  border-radius: 14px;
}

.contact-item-text span {
  display: block;
  color: #6d7a92;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.contact-item-text strong {
  display: block;
  color: #1f2a44;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: rgba(255, 255, 255, 0.98);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: #13213c;
  font-size: 14px;
  font-weight: 700;
}

.form-group input,
.form-group textarea {
  width: 100%;
  border: 1px solid #d8e3f7;
  border-radius: 16px;
  padding: 0 16px;
  color: #1f2a44;
  font: inherit;
  background: #ffffff;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input {
  height: 54px;
}

.form-group textarea {
  min-height: 190px;
  padding: 14px 16px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #155dfc;
  box-shadow: 0 0 0 4px rgba(21, 93, 252, 0.08);
}

.submit-btn {
  display: inline-flex;
  align-self: flex-end;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-width: 210px;
  height: 54px;
  padding: 0 24px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #155dfc 0%, #1e65f2 100%);
  border: none;
  border-radius: 14px;
  box-shadow: 0 18px 30px rgba(21, 93, 252, 0.22);
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 36px rgba(21, 93, 252, 0.28);
}

@media (max-width: 1120px) {
  .contact-shell {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .contact-section {
    padding-inline: 16px;
    padding-bottom: 84px;
  }

  .contact-panel {
    padding: 18px;
  }

  .contact-info {
    grid-template-columns: 1fr;
    text-align: left;
  }

  .contact-image {
    max-width: 260px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    width: 100%;
    min-width: 0;
    align-self: stretch;
  }
}
</style>
