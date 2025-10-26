<script>
  import MapTab from '../tabs/MapTab.vue';
  import { useDataStore } from '@/stores/dataStore.js';
  import { onMounted } from 'vue';

  export default {
    name: 'HomeView',
    components: { MapTab },
    setup() {
      const dataStore = useDataStore();

      const setMapInstance = (map) => dataStore.setMapInstance(map);

      onMounted(() => {
        dataStore.navigateToTaiwan();
      });

      return {
        setMapInstance,
      };
    },
  };
</script>

<template>
  <div id="app" class="d-flex flex-column vh-100">
    <div class="flex-grow-1 overflow-hidden position-relative">
      <MapTab @map-ready="setMapInstance" />
    </div>
  </div>
</template>

<style>
  @import '../assets/css/common.css';
</style>
