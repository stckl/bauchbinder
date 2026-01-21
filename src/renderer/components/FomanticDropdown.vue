<template>
    <select class="ui fluid search inverted dropdown" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
        <option value="">Schriftart wählen...</option>
        <option v-for="opt in options" :key="opt" :value="opt">
            {{ getMarker(opt) }}{{ opt }}{{ getWarning(opt) }}
        </option>
    </select>
</template>

<script setup>
const props = defineProps(['modelValue', 'options', 'customFonts', 'manualFonts', 'systemFonts']);
const emit = defineEmits(['update:modelValue']);

// Global constant for web fonts (should be imported or defined here if not available globally)
const WEB_FONTS = [
    'Arial, sans-serif', 'Helvetica, sans-serif', 'Verdana, sans-serif',
    'Trebuchet MS, sans-serif', 'Times New Roman, serif', 'Georgia, serif',
    'Garamond, serif', 'Courier New, monospace', 'Brush Script MT, cursive'
];

const getMarker = (opt) => {
    if (props.customFonts?.some(f => f.name === opt)) return '⭐ ';
    if (props.manualFonts?.includes(opt)) return '📄 ';
    return '';
};

const getWarning = (opt) => {
    if (!opt) return '';
    if (props.customFonts?.some(f => f.name === opt) || props.systemFonts?.includes(opt) || WEB_FONTS.includes(opt)) return '';
    return ' ⚠️ (Nicht im System gefunden!)';
};
</script>
