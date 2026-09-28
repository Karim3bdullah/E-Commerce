<script setup>
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue' 
import Footer from './components/Footer.vue';
import MiniCartDrawer from './components/MiniCartDrawer.vue';

const route = useRoute()
</script>

<template>
  <div class="app-root">
    <Navbar v-if="!route.meta.requiresAdmin && !route.meta.hideNavFooter" />
    
    <main class="app-main-content">
      <RouterView />
    </main>
    
    <Footer v-if="!route.meta.hideNavFooter" />

    <MiniCartDrawer />
  </div>
</template>

<style>
.app-root {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
}

.app-main-content {
  flex: 1;
  width: 100%;
  max-width: 100vw;
  min-width: 0;
  overflow-x: clip;
}
</style>