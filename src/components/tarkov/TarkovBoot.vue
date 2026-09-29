<script setup lang="ts">
import { onMounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'ready'): void
}>()

const lines = ref<string[]>([])
const isComplete = ref(false)

const pirateExtra = [
  'ПОДКЛЮЧЕНИЕ К ПИРАТСКОМУ КАНАЛУ... [YO-HO-HO]',
  'ПРОТОКОЛ ПРОВЕРКИ ПЕРИМЕТРА: "ЭЙ, ДРУЖОК, ТЫ ПОТЕРЯЛСЯ?" [OK]',
  'ОБНАРУЖЕН ПАКЕТ: "СКУФЧИК_2025" ... [ПРИНЯТО]',
  'СИГНАЛ ТРЕВОГИ: "МУТАНТЫ_ИЗ_КАНАЛИЗАЦИИ" ... [ПРОВЕРКА]',
  'СИНХРОНИЗАЦИЯ С РОФЛ-ПАКЕТОМ... [ГОТОВО]',
]

const bootText = [
  'ИНИЦИАЛИЗАЦИЯ ЗАЩИЩЁННОГО КАНАЛА TERRAGROUP...',
  'ПРОВЕРКА КЛЮЧ-КАРТ ДОСТУПА В "ЛАБОРАТОРИЮ"... [OK]',
  'ПОИСК АКТИВНЫХ МАЯКОВ В НОРВИНСКОЙ ОБЛАСТИ... [OK]',
  'СИНХРОНИЗАЦИЯ СО СХРОНОМ И ПОДСЧЁТ ПАТРОНОВ... [OK]',
  'АНАЛИЗ АКТИВНОСТИ ГРУППИРОВКИ "ДИКИЕ"... [OK]',
  'ПРОВЕРКА СТАТУСА КОНТЕЙНЕРА KAPPA... [НАЙДЕН]',
  'ПОИСК ТОЧЕК ЭВАКУАЦИИ... 100%',
  'ДЕШИФРОВКА ПЕРЕХВАТА: "ЧИКИ-БРИКИ И В ДАМКИ!"',
  ...pirateExtra,
  'СИСТЕМА ГОТОВА. УДАЧИ В РЕЙДЕ.',
]

onMounted(async () => {
  for (const line of bootText) {
    await new Promise((r) => setTimeout(r, Math.random() * 150 + 75))
    lines.value.push(line)
  }
  await new Promise((r) => setTimeout(r, 400))
  isComplete.value = true
  emit('ready')
})
</script>

<template>
  <div v-if="!isComplete" class="boot-screen">
    <div class="boot-container">
      <div v-for="(line, index) in lines" :key="index" class="boot-line">
        <span class="prefix">&gt;</span> {{ line }}
      </div>
      <div class="cursor-line">
        <span class="prefix">&gt;</span> <span class="typing-cursor">_</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boot-screen {
  position: absolute;
  inset: 0;
  background-color: #0d0d0d;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 40px;
  font-family: 'Consolas', 'Monaco', monospace;
  color: var(--tk-olive, #7e8a56);
  overflow: hidden;
}

.boot-screen::after {
  content: ' ';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background:
    linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
    linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size:
    100% 2px,
    3px 100%;
  pointer-events: none;
  z-index: 101;
}

.boot-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 900px;
}

.boot-line {
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  animation: fadeIn 0.15s ease-out;
  text-transform: uppercase;
}

.prefix {
  color: var(--tk-orange, #c7922d);
  margin-right: 12px;
  font-weight: bold;
}

.typing-cursor {
  background-color: var(--tk-olive, #7e8a56);
  width: 10px;
  height: 1.2rem;
  display: inline-block;
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
