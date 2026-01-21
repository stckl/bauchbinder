<template>
    <div ref="editorRef" style="height: 400px; border: 1px solid #444; border-radius: 4px; overflow: hidden;"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { css } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';

const props = defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const editorRef = ref(null);
let view = null;

onMounted(() => {
    const startState = EditorState.create({
        doc: props.modelValue,
        extensions: [
            basicSetup, css(), oneDark,
            EditorView.updateListener.of((u) => { if (u.docChanged) emit('update:modelValue', u.state.doc.toString()); }),
            EditorView.theme({ "&": { height: "100%", fontSize: "12px" }, ".cm-scroller": { overflow: "auto" } })
        ]
    });
    view = new EditorView({ state: startState, parent: editorRef.value });
});

watch(() => props.modelValue, (nv) => {
    if (view && nv !== view.state.doc.toString()) {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: nv } });
    }
});
</script>
