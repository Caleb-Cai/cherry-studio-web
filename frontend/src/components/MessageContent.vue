<template>
  <div class="message-content-wrapper">
    <div v-if="isMarkdown" v-html="renderedContent" class="markdown-content"></div>
    <div v-else class="text-content">{{ content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

interface Props {
  content: string
}

const props = defineProps<Props>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return '' // use external default escaping
  }
})

const isMarkdown = computed(() => {
  // Simple heuristic to detect markdown content
  return /```|`|\*\*|\*|#{1,6}\s|^\s*[-\*\+]\s|^\s*\d+\.\s/m.test(props.content)
})

const renderedContent = computed(() => {
  if (!props.content) return ''
  
  try {
    return md.render(props.content)
  } catch (error) {
    console.error('Markdown rendering error:', error)
    return props.content
  }
})
</script>

<style scoped>
.message-content-wrapper {
  width: 100%;
}

.text-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.5;
}

.markdown-content {
  line-height: 1.6;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 16px 0 8px 0;
  font-weight: 600;
}

.markdown-content :deep(h1) { font-size: 1.5em; }
.markdown-content :deep(h2) { font-size: 1.4em; }
.markdown-content :deep(h3) { font-size: 1.3em; }
.markdown-content :deep(h4) { font-size: 1.2em; }
.markdown-content :deep(h5) { font-size: 1.1em; }
.markdown-content :deep(h6) { font-size: 1em; }

.markdown-content :deep(p) {
  margin: 8px 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 8px 0;
  padding-left: 20px;
}

.markdown-content :deep(li) {
  margin: 4px 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--el-color-primary);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: var(--el-fill-color-lighter);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content :deep(pre) {
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--el-border-color);
}

.markdown-content :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 14px;
  line-height: 1.4;
}

.markdown-content :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid var(--el-border-color);
  padding: 8px 12px;
  text-align: left;
}

.markdown-content :deep(th) {
  background-color: var(--el-fill-color-light);
  font-weight: 600;
}

.markdown-content :deep(a) {
  color: var(--el-color-primary);
  text-decoration: none;
}

.markdown-content :deep(a:hover) {
  text-decoration: underline;
}

.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color);
  margin: 24px 0;
}
</style>
