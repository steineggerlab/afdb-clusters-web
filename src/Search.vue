<template>
    <v-container grid-list-md fluid px-2 py-1 id="search-container">
        <v-layout wrap>
            <v-flex xs12 pa-0>
                <v-parallax
                    :src="require('./assets/bg.png')"
                >
                    <v-row
                        align="center"
                        justify="center"
                    >
                        <v-col
                            class="text-center"
                            cols="12"
                        >
                            <h1 class="text-h4 font-weight-thin mb-4">
                                AlphaFold Clusters
                            </h1>
                            <h4 class="subheading">
                                Investigate the Foldseek clustered AlphaFold database
                            </h4>
                            
                            <br>
                             
                            <v-text-field
                                outlined
                                label="Query"
                                style="max-width: 400px; margin: 0 auto;"
                                v-model="query"
                                :append-icon="inSearch ? $MDI.mdiProgressWrench : $MDI.Magnify"
                                :disabled="inSearch"
                                @click:append="search"
                                @keyup.enter="search"
                                >
                            </v-text-field>

                            <h2 class="text-h6 mb-2">
                                Select by
                            </h2>

                            <v-chip-group
                                column
                                multiple
                                style="max-width: 400px; margin: 0 auto;"
                            >
                                <v-chip
                                    filter
                                    outlined
                                >
                                    Gene Ontology
                                </v-chip>
                                <v-chip
                                    filter
                                    outlined
                                >
                                    Taxonomy
                                </v-chip>
                                <v-chip
                                    filter
                                    outlined
                                >
                                    Keywords
                                </v-chip>
                                <v-chip
                                    filter
                                    outlined
                                >
                                    Dark
                                </v-chip>
                                <v-chip
                                    filter
                                    outlined
                                >
                                    Human
                                </v-chip>
                                <v-chip
                                    filter
                                    outlined
                                >
                                    More
                                </v-chip>
                            </v-chip-group>
                        </v-col>
                    </v-row>
                </v-parallax>
            </v-flex>
            <v-flex xs12 v-if="response.length > 0">
                <panel class="query-panel d-flex fill-height" fill-height>
                    <template slot="header">
                        Select cluster by UniProt member
                    </template>
                    <template slot="toolbar-extra">
                    </template>
                    <template slot="content">
                        <v-data-table
                            :headers="headers"
                            :items="response"
                        >
                            <template v-slot:item.rep_accession="prop">
                                <router-link :to="{ name: 'cluster', params: { cluster: prop.value }}">{{ prop.value }}</router-link>
                            </template>
                        </v-data-table>
                    </template>
                </panel>
            </v-flex>
            <v-flex xs12>
                <v-card rounded="0">
                <v-card-title primary-title class="pb-0 mb-0">
                    <div class="text-h5 mb-0">Reference</div>
                </v-card-title>
                <v-card-title primary-title class="pt-0 mt-0">
                    <p class="text-subtitle-2 mb-0">
                        Barrio-Hernandez I, Yeo J, Jänes J, Wein T, Varadi M, Velankar S, Beltrao P, Steinegger M. 
                        <a href="https://www.biorxiv.org/content/10.1101/2023.03.09.531927v1" target="_blank" rel="noopener">
                            Clustering predicted structures at the scale of the known protein universe.</a>
                        bioRxiv (2023)
                    </p>
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
            query: "O15067",
            inSearch: false,
            response: [],
            headers: [
                {
                    text: "Rep Accession",
                    value: "rep_accession",
                },
                {
                    text: "Average Length",
                    value: "avg_len",
                },
                // {
                //     text: "Annotation Score",
                //     value: "annotationScore",
                // },
                // {
                //     text: "Comments",
                //     value: "comments",
                // },
                // {
                //     text: "Entry Audit",
                //     value: "entryAudit",
                // },
                // {
                //     text: "Entry Type",
                //     value: "entryType",
                // },
                // {
                //     text: "Extra Attributes",
                //     value: "extraAttributes",
                // },
                // {
                //     text: "Features",
                //     value: "features",
                // },
                // {
                //     text: "Genes",
                //     value: "genes",
                // },
                // {
                //     text: "Keywords",
                //     value: "keywords",
                // },
                // {
                //     text: "Organism",
                //     value: "organism",
                // },
                // {
                //     text: "Protein Description",
                //     value: "proteinDescription",
                // },
                // {
                //     text: "Protein Existence",
                //     value: "proteinExistence",
                // },
                // {
                //     text: "References",
                //     value: "references",
                // },
                // {
                //     text: "Secondary Accessions",
                //     value: "secondaryAccessions",
                // },
                // {
                //     text: "Sequence",
                //     value: "sequence",
                // },
                // {
                //     text: "UniProtKB Cross References",
                //     value: "uniProtKBCrossReferences",
                // },
            ]
        };
    },
    mounted() {
        this.search();
    },
    methods: {
        log(value) {
            console.log(value);
        },
        search() {
            this.inSearch = true;
            this.$axios.post("/" + this.query)
                .then(response => {
                    this.response = response.data;
                    console.log(this.response)
                })
                .catch(() => {})
                .finally(() => {
                    this.inSearch = false;
                });
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

#search-container >>> .v-slide-group__content {
    justify-content: center;
}
</style>
