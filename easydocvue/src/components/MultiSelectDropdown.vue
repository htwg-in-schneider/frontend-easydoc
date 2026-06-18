<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface MultiSelectOption {
  value: string
  label: string
}

const props = withDefaults(defineProps<{
  modelValue: string[]
  options: MultiSelectOption[]
  placeholder?: string
  variant?: 'hero' | 'compact'
  multiple?: boolean
}>(), {
  placeholder: 'Auswählen',
  variant: 'compact',
  multiple: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const isOpen = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const radioGroupName = `multi-select-${Math.random().toString(36).slice(2)}`

const selectedLabel = computed(() => {
  if (props.modelValue.length === 0) return props.placeholder
  if (props.modelValue.length === 1) {
    return props.options.find((option) => option.value === props.modelValue[0])?.label || props.placeholder
  }
  return `${props.modelValue.length} ausgewählt`
})

function toggleOption(value: string) {
  if (!props.multiple) {
    emit('update:modelValue', [value])
    return
  }

  const nextValues = [...props.modelValue]
  const index = nextValues.indexOf(value)

  if (index >= 0) {
    nextValues.splice(index, 1)
  } else {
    nextValues.push(value)
  }

  emit('update:modelValue', nextValues)
}

function isSelected(value: string) {
  return props.modelValue.includes(value)
}

function toggleOpen() {
  isOpen.value = !isOpen.value
}

function onDocumentClick(event: MouseEvent) {
  if (!event.target) return
  const target = event.target as Node

  if (rootRef.value && !rootRef.value.contains(target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div ref="rootRef" class="multi-select" :class="`variant-${variant}`">
    <button type="button" class="select-trigger" @click="toggleOpen">
      <span class="select-label">{{ selectedLabel }}</span>
      <span class="select-icon">⌄</span>
    </button>

    <div v-if="isOpen" class="select-popup">
      <label v-for="option in options" :key="option.value" class="select-option">
        <input
          :type="multiple ? 'checkbox' : 'radio'"
          :name="multiple ? undefined : radioGroupName"
          :checked="isSelected(option.value)"
          @change="toggleOption(option.value)"
        >
        <span>{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>

<style scoped>
.multi-select {
  position: relative;
  z-index: 20;
  width: 100%;
  min-width: 0;
  height: 100%;
}

.select-trigger {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px;
  color: #1f2a44;
  font: inherit;
  text-align: left;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  box-shadow: 0 10px 22px rgba(24, 58, 150, 0.08);
  cursor: pointer;
  overflow: hidden;
}

.variant-hero .select-trigger {
  font-size: 16px;
}

.variant-compact .select-trigger {
  font-size: 15px;
}

.select-label {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-icon {
  flex: 0 0 auto;
  color: #155dfc;
  line-height: 1;
}

.select-popup {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 2000;
  display: grid;
  width: 100%;
  min-width: 100%;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  box-shadow: 0 16px 34px rgba(24, 58, 150, 0.18);
  box-sizing: border-box;
}

.select-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  color: #26334d;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;
}

.select-option:hover {
  color: #155dfc;
  background: #eef3fb;
}

.select-option input {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  margin: 0;
  accent-color: #155dfc;
}

.select-option span {
  min-width: 0;
  line-height: 1.25;
  word-break: break-word;
}
</style>
