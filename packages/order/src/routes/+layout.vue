<script lang="ts" setup>
import { RouterView } from 'vue-router';
import { useLocalStorage } from '@vueuse/core';
import { XButton } from '@x/ui';

const token = useLocalStorage('token', null);

function signOut() {
  token.value = null;
  history.pushState({}, '', '/');
}
</script>

<template>
  {{ token }}
  <RouterView />
  <XButton color="secondary" @click="signOut">Sign out</XButton>
</template>
