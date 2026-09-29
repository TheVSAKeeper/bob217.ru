<script lang="ts" setup>
import { computed } from 'vue'
import { useCardRepos } from '@/composables/useCardRepos'
import { useWeekSchedule } from '@/composables/useWeekSchedule'
import { ago, plural } from '@/utils/format'

interface Entry {
  key: string
  value: string
  url?: string
  live?: boolean
}

interface Section {
  name: string
  entries: Entry[]
}

const props = defineProps<{
  authors: number
}>()

const { repos, freshest } = useCardRepos()
const { days } = useWeekSchedule()

const today = computed(() => {
  const day = days.value.find((d) => d.isCurrent)
  if (!day) return ''
  const what = day.description.split('.')[0]?.trim().toLowerCase() ?? ''
  return `${day.label.toLowerCase()}, ${what}`
})

const sections = computed<Section[]>(() =>
  [
    {
      name: 'user',
      entries: [
        { key: 'name', value: 'bob217' },
        { key: 'channel', value: '.net помойка' },
        { key: 'signature', value: 'Signed-off-by: bob217.ru' },
      ],
    },
    {
      name: 'team',
      entries: [
        { key: 'name', value: 'BobGroup' },
        { key: 'mode', value: 'работаем на себя' },
        {
          key: 'authors',
          value: props.authors
            ? `${props.authors} ${plural(props.authors, 'человек', 'человека', 'человек')}, список выше`
            : '',
          live: true,
        },
      ],
    },
    {
      name: 'stream',
      entries: [
        { key: 'days', value: 'пн–пт, начинаем примерно в 18:00 МСК' },
        { key: 'weekend', value: 'отдыхаем, но мб чего и будем делать' },
        { key: 'today', value: today.value, live: true },
        { key: 'url', value: 'twitch.tv/bobito217', url: 'https://www.twitch.tv/bobito217' },
      ],
    },
    {
      name: 'core',
      entries: [
        { key: 'task', value: 'оркестратор медиа: с ютуба на диск, с диска в рутуб и вк видео' },
        { key: 'stack', value: 'C#, Vue, немного Go и Python' },
        { key: 'policy', value: 'форки и PR принимаем, плагины пишем по приколу' },
      ],
    },
    {
      name: 'remote "origin"',
      entries: [
        {
          key: 'url',
          value: 'github.com/MaxNagibator',
          url: 'https://github.com/MaxNagibator',
        },
        {
          key: 'repos',
          value: repos.value.size ? `${repos.value.size} публичных` : '',
          live: true,
        },
        {
          key: 'hot',
          value: freshest.value
            ? `${freshest.value.name}, тронут ${ago(freshest.value.pushed)}`
            : '',
          live: true,
        },
      ],
    },
  ].map((s) => ({ ...s, entries: s.entries.filter((e) => e.value) })),
)
</script>

<template>
  <div class="file">
    <p class="path">
      ~/.gitconfig
      <span class="legend"><i class="dot"></i> живое, из GitHub и расписания</span>
    </p>

    <div class="body">
      <section v-for="section in sections" :key="section.name" class="section">
        <p class="head">[{{ section.name }}]</p>
        <dl class="entries">
          <div v-for="entry in section.entries" :key="entry.key" class="line">
            <dt :class="{ live: entry.live }">{{ entry.key }}</dt>
            <dd>
              <a v-if="entry.url" :href="entry.url" target="_blank" rel="noopener noreferrer">{{
                entry.value
              }}</a>
              <template v-else>{{ entry.value }}</template>
            </dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.file {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.path {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-xs);
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-bg-tertiary);
}

.legend {
  display: flex;
  align-items: center;
  gap: 0.7ch;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--color-success);
}

.body {
  padding: var(--spacing-lg);
}

.section + .section {
  margin-top: var(--spacing-md);
}

.head {
  margin: 0;
  color: var(--color-accent);
}

.entries {
  margin: 0;
}

.line {
  display: flex;
  flex-wrap: wrap;
  padding-left: 2ch;
}

dt {
  color: var(--color-link);
}

dt::after {
  content: ' = ';
  color: var(--color-text-muted);
  white-space: pre;
}

dt.live::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 0.7ch;
  vertical-align: middle;
  border-radius: var(--radius-full);
  background: var(--color-success);
}

dd {
  margin: 0;
  color: var(--color-text-secondary);
  overflow-wrap: anywhere;
}

.line a {
  color: var(--color-text-primary);
  text-decoration: underline dotted;
  text-underline-offset: 4px;
  text-decoration-color: rgba(255, 255, 255, 0.25);
}

.line a:hover {
  color: var(--color-link-hover);
  text-decoration-color: currentcolor;
}

@media (max-width: 720px) {
  .file {
    font-size: var(--font-size-xs);
  }

  .body {
    padding: var(--spacing-md);
  }

  .line {
    padding-left: 1ch;
  }
}
</style>
