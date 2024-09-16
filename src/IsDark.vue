<template>
    <!-- cluFlag 1: clustered in AFDB50, 2: clustered in AFDB clusters, 3: removed (fragments in Foldseek clusters), 4: removed (singletons in Foldseek clusters) -->
    <v-chip :color="flagColor" outlined>
        {{ flagText }}
    </v-chip>
</template>

<script>

export default {
    name: "IsDark",
    props: ["isDark"],
    computed: {
        flagText() {
            if (this.isDark == 0) {
                return "Non-singleton";
            } else if (this.isDark == 1) {
                return "Singleton";
            }
        },
        flagColor() {
            if (this.isDark == 0) {
                return "#8FB5D6";
            } else if (this.isDark == 1) {
                return "#FFC8C1";
            }
        }
    }
}

</script>

<style scoped>
.v-chip-group .v-chip--active {
    font-weight: bold;
    border-width: 2px;
}
</style>