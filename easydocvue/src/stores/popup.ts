import { defineStore } from 'pinia'
import { ref } from 'vue'

type PopupMode = 'message' | 'confirmation'
type PopupVariant = 'info' | 'success' | 'warning' | 'danger'

interface PopupOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: PopupVariant
}

function normalizeOptions(messageOrOptions: string | PopupOptions): PopupOptions {
  return typeof messageOrOptions === 'string'
    ? { message: messageOrOptions }
    : messageOrOptions
}

export const usePopupStore = defineStore('popup', () => {
  const isOpen = ref(false)
  const mode = ref<PopupMode>('message')
  const variant = ref<PopupVariant>('info')
  const title = ref('Hinweis')
  const message = ref('')
  const confirmLabel = ref('OK')
  const cancelLabel = ref('Abbrechen')

  let resolveCurrent: ((confirmed: boolean) => void) | null = null

  function open(modeValue: PopupMode, messageOrOptions: string | PopupOptions) {
    resolveCurrent?.(false)

    const options = normalizeOptions(messageOrOptions)
    mode.value = modeValue
    variant.value = options.variant ?? 'info'
    title.value = options.title ?? (modeValue === 'confirmation' ? 'Bitte bestätigen' : 'Hinweis')
    message.value = options.message
    confirmLabel.value = options.confirmLabel ?? 'OK'
    cancelLabel.value = options.cancelLabel ?? 'Abbrechen'
    isOpen.value = true

    return new Promise<boolean>((resolve) => {
      resolveCurrent = resolve
    })
  }

  async function showMessage(messageOrOptions: string | PopupOptions) {
    await open('message', messageOrOptions)
  }

  function showConfirmation(messageOrOptions: string | PopupOptions) {
    return open('confirmation', messageOrOptions)
  }

  function close(confirmed: boolean) {
    isOpen.value = false
    resolveCurrent?.(confirmed)
    resolveCurrent = null
  }

  function accept() {
    close(true)
  }

  function cancel() {
    close(false)
  }

  return {
    isOpen,
    mode,
    variant,
    title,
    message,
    confirmLabel,
    cancelLabel,
    showMessage,
    showConfirmation,
    accept,
    cancel,
  }
})
