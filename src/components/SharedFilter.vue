<template>
    <div class="filter-container">
        <select 
            v-model="selectedCategory" 
            @change="$emit('filter', selectedCategory)" 
            class="filter-select"
        >
            <option value="">{{ t('home.allCategories') }}</option>
            <option v-for="(category, index) in categories" :key="index" :value="category.original">
                {{ category.translated }}
            </option>
        </select>
        <i class="fa-solid fa-chevron-down select-icon"></i>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
    categories: {
        type: Array,
        required: true,
        default: () => []
    }
})

defineEmits(['filter'])
const selectedCategory = ref('')
</script>

<style scoped>
.filter-container {
    position: relative;
    width: 100%;
    max-width: 260px;
}
.filter-select {
    width: 100%;
    min-height: 44px;
    padding-inline-start: 16px;
    padding-inline-end: 42px;
    padding-block: 10px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.95rem;
    color: #1e293b;
    background-color: #ffffff;
    appearance: none;
    cursor: pointer;
    transition: all 0.3s;
}
.filter-select:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
.select-icon {
    position: absolute;
    inset-inline-end: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    font-size: 0.85rem;
}

@media (max-width: 480px) {
    .filter-container {
        max-width: 100%;
    }
}
</style>