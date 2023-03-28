<template>
    <v-container grid-list-md fluid px-2 py-1 id="search-container">
        <v-layout wrap>
            <v-flex xs12 pa-0 >
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
                                Investigate the <a href="https://foldseek.com" target="_blank" rel="noopener">Foldseek</a> clustered <a href="https://alphafold.ebi.ac.uk">AlphaFold database</a>
                            </h4>
                            
                            <br>
                             
                            <v-text-field
                                outlined
                                label="UniProt accession"
                                style="max-width: 400px; margin: 0 auto;"
                                v-model="query"
                                :append-icon="inSearch ? $MDI.mdiProgressWrench : $MDI.Magnify"
                                :disabled="inSearch"
                                @click:append="search"
                                @keyup.enter="search"
                                @change="selectedExample = null"
                                dark
                                >
                            </v-text-field>
                            
                            <template>
                            <h2 class="text-h6 mb-2">
                                Examples
                            </h2>
                            <v-chip-group
                                column
                                dark
                                v-model="selectedExample"
                                style="max-width: 400px; margin: 0 auto; "
                            >

                                <v-chip v-for="item in examples" :key="item.id"
                                    outlined v-on:click="query=item.id" >
                                    <b>{{ item.id }}</b> &emsp; {{ item.desc }}
                                </v-chip>
                            </v-chip-group>
                            </template>
                        </v-col>
                    </v-row>
                </v-parallax>
            </v-flex>
            <v-flex xs12 v-if="false && response.length > 0">
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

                            <template v-slot:item.avg_len="prop">
                                {{ prop.value.toFixed(2) }}
                            </template>

                            <template v-slot:item.avg_plddt="prop">
                                {{ prop.value.toFixed(2) }}
                            </template>


                            <template v-slot:item.rep_plddt="prop">
                                {{ prop.value.toFixed(2) }}
                            </template>


                            <template v-slot:item.lca_tax_id="prop">
                                <TaxSpan :taxonomy="prop.value"></TaxSpan>
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
import TaxSpan from "./TaxSpan.vue";

export default {
    name: "search",
    components: { 
        Panel,
        FileButton,
        TaxSpan,
    },
    data() {
        return {
            query: "B4DKH6",
            selectedExample: 1,
            examples: [
                {id:'A0A849TG76', desc:'predicted \'Transporter\' protein'},
                {id:'B4DKH6', desc:'Bactericidal permeability-increasing protein'},
                {id:'A0A1G5ASE0', desc:'Histone (bacteria)'},
                {id:'A0A1S3QU81', desc:' Gasdermin containing domain'},
            ],
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
                {
                    text: "Average pLDDT",
                    value: "avg_plddt",
                },
                {
                    text: "Number of members",
                    value: "n_mem",
                },
                {
                    text: "LCA Taxonomy",
                    value: "lca_tax_id",
                },
                {
                    text: "Is Dark",
                    value: "is_dark",
                },
                {
                    text: "Rep pLDDT",
                    value: "rep_plddt",
                },
                {
                    text: "Rep Length",
                    value: "rep_len",
                },
            ]
        };
    },
    mounted() {
    },
    methods: {
        log(value) {
            console.log(value);
        },
        search() {
            this.inSearch = true;
            this.$axios.post("/" + this.query)
                .then(response => {
                    // this.response = response.data;
                    this.$router.push({ name: 'cluster', params: { cluster: response.data[0].rep_accession } })
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
