<script setup>
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue' 
import Footer from './components/Footer.vue';

const route = useRoute()
</script>

<template>
  <Navbar v-if="!route.meta.requiresAdmin && !route.meta.hideNavFooter" />
  
  <RouterView />
  
  <Footer v-if="!route.meta.hideNavFooter" />
</template>

<style>
* {
  text-decoration: none;
}
body {
  margin: 0;
  font-family: 'Cairo', sans-serif; 
  background-color: #f8fafc;
}
</style>