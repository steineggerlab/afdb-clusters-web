<template>
    <v-container grid-list-md fluid px-2 py-1>
        <v-layout wrap>
            <v-flex xs12>
                <panel class="query-panel d-flex fill-height" fill-height>
                    <template slot="header">
                    </template>
                    <template slot="toolbar-extra">
                    </template>
                    <template slot="content">
                    </template>
                </panel>
            </v-flex>
            <v-flex xs12>
                <panel collapsible collapsed>
                    <template slot="header">
                    </template>
                    <div slot="content">
                    </div>
                </panel>
            </v-flex>
            <v-flex xs12>
                <panel>
                    <template slot="content">
                        <div class="actions" :style="!$vuetify.breakpoint.xsOnly ? 'display:flex; align-items: center;' : null">
                            <v-btn color="primary" :block="$vuetify.breakpoint.xsOnly" x-large><v-icon>{{ $MDI.Magnify }}</v-icon>&nbsp;Search</v-btn>
                        </div>
                    </template>
                </panel>
            </v-flex>
            <v-flex xs12>
                <v-card rounded="0">
                <v-card-title primary-title class="pb-0 mb-0">
                    <div class="text-h5 mb-0">Reference</div>
                </v-card-title>
                <v-card-title primary-title class="pt-0 mt-0">
                    <p class="text-subtitle-2 mb-0">cite</p>
                </v-card-title>
                </v-card>
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>
import Panel from "./Panel.vue";
import FileButton from "./FileButton.vue";

export default {
    name: "search",
    components: { 
        Panel,
        FileButton,
    },
    data() {
        return {
        };
    },
    mounted() {
    },
    created() {
        this.fetchData();
    },
    watch: {
        $route: "fetchData",
    },
    methods: {
        fetchData() {
            // this.$axios.get("")
            //     .then(response => {})
            //     .catch(() => {});
        },
    }
};
</script>

<style scoped>
.search-component >>> .v-input--checkbox {
    margin-top: 0px;
}

.search-component >>> .input-group label {
    font-size: 16px;
}

.search-component >>> .v-text-field {
    margin-top: 0px;
    padding-top: 0px;
    margin-bottom: 8px;
}

code {
    font-size: 0.8em;
}

.theme--dark .v-input label {
    color: #FFFFFFB3;
}

.theme--light .v-input label {
    color: #00000099;
}
</style>
