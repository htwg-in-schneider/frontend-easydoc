<script setup lang="ts">
import { reactive } from 'vue'

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

function sendMail() {
  const subject = encodeURIComponent(form.subject)
  const body = encodeURIComponent(
    `Name: ${form.name}\nE-Mail: ${form.email}\n\n${form.message}`
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
    <div class="contact-container">
      <h2 class="contact-title">Kontakt aufnehmen</h2>
      <p class="contact-subtitle">Haben Sie Fragen oder Anregungen? Schreiben Sie uns!</p>

      <form class="contact-form" @submit.prevent="sendMail">
        <div class="form-row">
          <div class="form-group">
            <label for="contact-name">Name</label>
            <input
              id="contact-name"
              v-model="form.name"
              type="text"
              placeholder="Ihr Name"
              required
            />
          </div>
          <div class="form-group">
            <label for="contact-email">E-Mail</label>
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
            rows="6"
            required
          ></textarea>
        </div>

        <button type="submit" class="submit-btn">Nachricht senden</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.contact-section {
  background: #f0f6fe;
  padding: 60px 80px;
}

.contact-container {
  max-width: 800px;
  margin: 0 auto;
}

.contact-title {
  font-size: 32px;
  color: #333;
  margin: 0 0 12px;
}

.contact-subtitle {
  font-size: 16px;
  color: #555;
  margin: 0 0 36px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 15px;
  color: #333;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 15px;
  color: #333;
  background: white;
  outline: none;
  transition: border-color 0.2s;
  font-family: Arial, sans-serif;
}

.form-group input {
  height: 55px;
}

.form-group textarea {
  padding: 14px 16px;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #155dfc;
}

.submit-btn {
  align-self: flex-start;
  background: #155dfc;
  color: white;
  border: none;
  border-radius: 10px;
  height: 50px;
  padding: 0 36px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.submit-btn:hover {
  background: #0d4ad4;
}

@media (max-width: 768px) {
  .contact-section {
    padding: 40px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    align-self: stretch;
  }
}
</style>
