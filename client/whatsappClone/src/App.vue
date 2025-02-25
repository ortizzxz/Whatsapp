<script>
import Chat from '@/components/Chat.vue'

export default {
  name: 'App',
  components: {
    Chat
  }
}
</script>

<template>
  <div id="app">
    <Chat />
  </div>
</template>


<style scoped>
  #app{
    height: 100dvh;
  }
</style>
