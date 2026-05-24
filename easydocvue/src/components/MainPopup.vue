<script setup lang="ts">
import { computed } from 'vue'
import { usePopupStore } from '@/stores/popup'

const popup = usePopupStore()

const icon = computed(() => {
  switch (popup.variant) {
    case 'success':
      return 'mdi-check-circle'
    case 'warning':
      return 'mdi-alert'
    case 'danger':
      return 'mdi-delete-alert'
    default:
      return 'mdi-information'
  }
})
</script>

<template>
  <v-dialog :model-value="popup.isOpen" max-width="460" persistent>
    <div class="main-popup" :class="`variant-${popup.variant}`" role="dialog" aria-modal="true">
      <div class="popup-body">
        <div class="popup-icon">
          <v-icon size="28">{{ icon }}</v-icon>
        </div>

        <div class="popup-copy">
          <h2>{{ popup.title }}</h2>
          <p>{{ popup.message }}</p>
        </div>
      </div>

      <div class="popup-actions">
        <button
          v-if="popup.mode === 'confirmation'"
          type="button"
          class="btn btn-secondary"
          @click="popup.cancel"
        >
          {{ popup.cancelLabel }}
        </button>
        <button type="button" class="btn btn-primary" @click="popup.accept">
          {{ popup.confirmLabel }}
        </button>
      </div>
    </div>
  </v-dialog>
</template>

<style scoped>
.main-popup {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 18px 54px rgba(0, 0, 0, 0.18);
  padding: 24px;
}

.popup-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.popup-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #eef4ff;
  color: #155dfc;
}

.popup-copy h2 {
  margin: 0 0 8px;
  color: #242424;
  font-size: 22px;
  line-height: 1.2;
}

.popup-copy p {
  margin: 0;
  color: #555;
  font-size: 16px;
  line-height: 1.5;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 104px;
  height: 44px;
  padding: 0 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: background 0.2s, color 0.2s;
}

.btn-primary {
  background: #155dfc;
  color: #fff;
}

.btn-primary:hover {
  background: #0f4ad4;
}

.btn-secondary {
  background: #f0f6fe;
  color: #155dfc;
}

.btn-secondary:hover {
  background: #dce8fd;
}

.variant-success .popup-icon {
  background: #eef8e8;
  color: #4f8f1f;
}

.variant-warning .popup-icon {
  background: #fff7e6;
  color: #b26a00;
}

.variant-danger .popup-icon {
  background: #feecec;
  color: #dc3545;
}

.variant-danger .btn-primary {
  background: #dc3545;
}

.variant-danger .btn-primary:hover {
  background: #b02a37;
}

@media (max-width: 600px) {
  .main-popup {
    margin: 16px;
    padding: 20px;
  }

  .popup-body {
    gap: 12px;
  }

  .popup-copy h2 {
    font-size: 20px;
  }

  .popup-actions {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
  }
}
</style>
