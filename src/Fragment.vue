<template>
    <!-- cluFlag 1: clustered in AFDB50, 2: clustered in AFDB clusters, 3: removed (fragments in Foldseek clusters), 4: removed (singletons in Foldseek clusters) -->
    <v-chip :color="flagColor" outlined>
        {{ flagText }}
    </v-chip>
</template>

<script>

export default {
    name: "Fragment",
    props: ["flag"],
    computed: {
        flagText() {
            if (this.flag == 1) {
                return "AFDB50/MMseqs2";
            } else if (this.flag == 2) {
                return "AFDB/Foldseek";
            } else if (this.flag == 3) {
                return "Fragment";
            } else if (this.flag == 4) {
                return "Singleton";
            }
        },
        flagColor() {
            if (this.flag == 1) {
                return "#8FB5D6";
            } else if (this.flag == 2) {
                return "#9ED19F";
            } else if (this.flag == 3) {
                return "#C29BFF";
            } else if (this.flag == 4) {
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