<template>
<v-app-bar app height="48px" fixed clipped-left :class="['ml-0', 'pl-3']">
    <!-- <v-app-bar-nav-icon :input-value="!mini ? 'activated' : undefined" @click.stop="toggleMini"></v-app-bar-nav-icon> -->
    <v-app-bar-title><router-link to="/" style="color: inherit; text-decoration: none">AFDB Clusters</router-link></v-app-bar-title>
    <img src="./assets/marv-foldseek-small.png" style="margin-left:8px; display: inline-block; width: 48px;height: 48px;vertical-align: middle" aria-hidden="true" />

    <v-spacer></v-spacer>
    <v-toolbar-items class="hidden-sm-and-down">
        <v-btn v-for="link in links" :key="link.title" text :href="link.href" rel="external noopener" target="_blank">{{ link.title }}</v-btn>
        <v-btn icon rel="external noopener" target="_blank" href="https://github.com/steineggerlab/afdb-clusters-analysis">
            <v-icon>{{ $MDI.GitHub }}</v-icon>
        </v-btn>
    </v-toolbar-items>
    <v-menu class="hidden-md-and-up">
        <template v-slot:activator="{ on }">
          <v-btn
            icon
            v-on="on"
            class="hidden-md-and-up"
          >
            <v-icon>{{ $MDI.DotsVertical }}</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item v-for="link in links" :key="link.title" rel="external noopener" target="_blank" :href="link.href">
            <v-list-item-content>
              <v-list-item-title>{{ link.title }}</v-list-item-title>
             </v-list-item-content>
          </v-list-item>
          <v-list-item rel="external noopener" target="_blank" href="https://github.com/steineggerlab/afdb-clusters-analysis">
            <v-list-item-content>
              <v-list-item-title>GitHub</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
</v-app-bar>
</template>

<script>
export default {
    data: () => ({
        mini: true,
        links: [
            { title: "Dark enzymes prediction", href: "https://github.com/jurgjn/af-protein-universe" },
            { title: "Data download", href: "https://afdb-cluster.steineggerlab.workers.dev" },
            { title: "Beltrao Lab", href: "https://imsb.ethz.ch/research/beltrao.html" },
            { title: "Steinegger Lab", href: "https://steineggerlab.com/en/" },
        ]
    }),
    created() {
        this.$root.$on('multi', this.shouldExpand);
    },
    mounted() {
        // defeat https://github.com/vuetifyjs/vuetify/pull/14523
        // Object.defineProperty(this.$refs.drawer._data, 'isMouseover', { get: () => { false } })
    },
    beforeDestroy() {
        this.$root.$off('multi', this.shouldExpand);
    },
    methods: {
        shouldExpand(expand) {
            this.mini = !expand;
        },
        toggleMini() {
            this.mini = !this.mini;
        },
    }
}
</script>
