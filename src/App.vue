<template>
    <v-app id="app">
        <navigation />
        <v-main>
            <router-view></router-view>
        </v-main>
    </v-app>
</template>

<script>
import Navigation from './Navigation.vue';

export default {
    components: { Navigation },
}
</script>