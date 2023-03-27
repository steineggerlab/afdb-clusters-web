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
                                Investigate the Foldseek clustered AlphaFold database
                            </h4>
                            
                            <br>
                             
                            <v-text-field
                                outlined
                                label="Uniprot Accession"
                                style="max-width: 400px; margin: 0 auto;"
                                v-model="query"
                                :append-icon="inSearch ? $MDI.mdiProgressWrench : $MDI.Magnify"
                                :disabled="inSearch"
                                @click:append="search"
                                @keyup.enter="search"
                                dark
                                >
                            </v-text-field>
                            
                            <template>
                            <h2 class="text-h6 mb-2">
                                Examples
                            </h2>
                            <v-chip-group
                                column
                                multiple
                                dark
                                style="max-width: 400px; margin: 0 auto; "
                            >

                                <v-expansion-panels variant="accordion">
                                    <v-expansion-panel 
                                    v-for="(item,i) in [2,3,5]"
                                    :key="i"
                                    >
                                    <v-expansion-panel-header >Fig {{ item }}</v-expansion-panel-header>
                                    <v-expansion-panel-content>

                                        <v-chip v-for="item in examples[item]" :key="item.id"
                                            outlined v-on:click="query=item.id" >
                                            <b>{{ item.id }}</b> &emsp; {{ item.desc }}
                                        </v-chip>
                                    </v-expansion-panel-content>
                                    </v-expansion-panel>
                                </v-expansion-panels>
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
            query: "A0A0U4CV73",
            examples: {
                '2': [
                {id:'A0A849TG76', desc:'Fig2 B'},
                {id:'A0A2D8BRH7', desc:'Fig2 B'},
                {id:'A0A849ZK06', desc:'Fig2 C'},
                {id:'S0EUL8', desc:'Fig2 D'},],
                '3': [
                {id:'A0A2R8Y619', desc:'Fig3 C'},
                {id:'A0A1G5ASE0', desc:'Fig3 C'},
                {id:'B4DKH6', desc:'Fig3 C'},
                {id:'A0A2D5ZNG0', desc:'Fig3 C'},
                {id:'O14862', desc:'Fig3 C'},
                {id:'A0A1C5UEQ5', desc:'Fig3 C'},],
                '5': [
                {id:'A0A2G2HCA2', desc:'Fig5 A'},
                {id:'A0A6S6SJ77', desc:'Fig5 A'},
                {id:'A0A165QK09', desc:'Fig5 A'},
                {id:'A0A7S2NND9', desc:'Fig5 B'},
                {id:'A0A110BF64', desc:'Fig5 B'},
                {id:'A0A4Q1CFA1', desc:'Fig5 C'},
                {id:'A0A0C9TQR4', desc:'Fig5 C'},
                {id:'O60443', desc:'Fig5 C'},
                {id:'A0A1S3QU81', desc:'Fig5 C'},
                {id:'A0A2C5ZLK3', desc:'Fig5 C'},
                {id:'A0A317WF00', desc:'Fig5 C'},],
        },
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
