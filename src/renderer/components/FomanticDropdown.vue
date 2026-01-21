<template>
    <select class="ui fluid search inverted dropdown" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">Schriftart wählen...</option>
        <option v-for="opt in options" :key="opt" :value="opt">
            {{ getMarker(opt) }}{{ cleanName(opt) }}{{ getWarning(opt) }}
        </option>
    </select>
</template>

<script setup>
const props = defineProps(['modelValue', 'options', 'customFonts', 'manualFonts', 'systemFonts']);
const emit = defineEmits(['update:modelValue']);

const WEB_FONTS = [
    'Arial, sans-serif', 'Helvetica, sans-serif', 'Verdana, sans-serif',
    'Trebuchet MS, sans-serif', 'Times New Roman, serif', 'Georgia, serif',
    'Garamond, serif', 'Courier New, monospace', 'Brush Script MT, cursive',
    'sans-serif', 'serif', 'monospace'
];

const cleanName = (name) => {
    if (!name) return '';
    return name.replace(/!important/g, '').replace(/['"]/g, '').trim();
};

const getMarker = (opt) => {
    const name = cleanName(opt);
    if (props.customFonts?.some(f => f.name === name)) return '⭐ ';
    if (props.manualFonts?.includes(name)) return '📄 ';
    return '';
};

const getWarning = (opt) => {
    if (!opt) return '';
    const name = cleanName(opt);
    // No warning for system fonts, custom fonts or standard web fonts
    if (props.customFonts?.some(f => f.name === name) || 
        props.systemFonts?.includes(name) || 
        WEB_FONTS.some(wf => name.toLowerCase().includes(wf.toLowerCase()))) return '';
    return ' ⚠️ (Nicht im System gefunden!)';
};
</script>
