<template>
    <div class="filter-container">
        <select 
            v-model="selectedCategory" 
            @change="$emit('filter', selectedCategory)" 
            class="filter-select"
        >
            <option value="">كل الأقسام</option>
           <option value="">{{ t('home.allCategories') }}</option>
             
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
    max-width: 250px;
}
.filter-select {
    width: 100%;
    padding: 10px 15px 10px 40px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
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
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}
</style>