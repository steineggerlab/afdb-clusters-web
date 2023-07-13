<template>
    <v-container grid-list-md fluid px-0 py-0 id="search-container">
        <v-layout wrap>
            <v-flex xs12 pa-0 >
                <v-parallax
                    :height="windowHeight"
                    :src="require('./assets/bg.png')"
                    dark
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
                                Investigate the <a href="https://foldseek.com" target="_blank" rel="noopener">Foldseek</a> clustered <a href="https://alphafold.ebi.ac.uk" target="_blank" rel="noopener">AlphaFold database</a>
                            </h4>
                            
                            <br>
                             
                            <v-tabs
                                class="search-select"
                                slider-size="1"
                                v-model="tab"
                                centered
                                background-color="transparent"
                                dark
                            >
                                <v-tab>UniProt</v-tab>
                                <v-tab>Gene ontology</v-tab>
                                <v-tab>Structure</v-tab>
                            </v-tabs>
                            <v-tabs-items v-model="tab" style="padding: 1em;">
                                <v-tab-item>
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
                                        @keydown="error = null"
                                        :error="error != null"
                                        :error-messages="error ? error : []"
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
                                </v-tab-item>
                                <v-tab-item>
                                    <v-text-field
                                        outlined
                                        label="GO ID"
                                        style="max-width: 400px; margin: 0 auto;"
                                        v-model="query_GO"
                                        :append-icon="inSearch ? $MDI.mdiProgressWrench : $MDI.Magnify"
                                        :disabled="inSearch"
                                        @click:append="GOsearch"
                                        @keyup.enter="GOsearch"
                                        @change="selectedExample = null"
                                        @keydown="error = null"
                                        :error="error != null"
                                        :error-messages="error ? error : []"
                                        dark
                                        >
                                    </v-text-field>
                                    <v-radio-group 
                                        style="
                                            max-width: 400px;
                                            margin: 0 auto;
                                            "
                                        v-model="go_search_type"
                                        inline>
                                        <v-radio name="go_search_type" label="include lower GO lineage" value="lower" dark></v-radio>
                                        <v-radio name="go_search_type" label="Exact" value="exact" dark ></v-radio>
                                    </v-radio-group>
                                </v-tab-item>
                                <v-tab-item>
                                    <FoldseekSearchButton @response="foldseekResult" dark></FoldseekSearchButton>
                                </v-tab-item>
                            </v-tabs-items>
                        </v-col>
                    </v-row>
                </v-parallax>
            </v-flex>
            <v-flex xs12 v-if="response != null" ref="results">
                <panel class="query-panel d-flex fill-height" fill-height>
                    <template slot="header">
                        Cluster selection
                    </template>
                    <template slot="toolbar-extra">
                    </template>
                    <GoTermResultList goterm=""></GoTermResultList>
                    <template slot="content">
                        <v-data-table
                            :headers="headers"
                            :items="response"
                            :options.sync="options"
                            :server-items-length="options.totalMembers"
                        >
                            <template v-slot:item.rep_accession="prop">
                                <router-link :to="{ name: 'cluster', params: { cluster: prop.value }}" target='_blank'>{{ prop.value }}</router-link>
                            </template>

                            <template v-slot:item.avg_plddt="prop">
                                {{ prop.value.toFixed(2) }}
                            </template>


                            <template v-slot:item.rep_plddt="prop">
                                {{ prop.value.toFixed(2) }}
                            </template>

                            <template v-slot:header.lca_tax_id="{ header }">
                                    <TaxonomyAutocomplete
                                        cluster="null"
                                        v-model="options.tax_id"
                                        :urlFunction="(a, b) => '/cluster/' + a + '/search/taxonomy/' + b"
                                        :disabled="taxAutocompleteDisabled"
                                        :bundle_data="bundle_original"
                                    ></TaxonomyAutocomplete>
                            </template>

                            <template v-slot:item.lca_tax_id="prop">
                                <TaxSpan :taxonomy="prop.value"></TaxSpan>
                            </template>

                            <template v-slot:header.is_dark="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" :outlined="options.is_dark != null">
                                            {{ header.text }}
                                        </v-btn>
                                    </template>

                                    <v-card style="padding: 2em; width: 250px;">
                                        <h3>Filter by</h3>
                                        <v-chip-group column v-model="options.is_dark">
                                            <IsDark isDark="0"></IsDark>
                                            <IsDark isDark="1"></IsDark>
                                        </v-chip-group>
                                    </v-card>
                                </v-menu>
                            </template>

                            <template v-slot:item.is_dark="prop">
                                <IsDark :isDark="prop.value"></IsDark>
                            </template>

                            <template v-slot:header.avg_len="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" >
                                            {{ header.text }}
                                        </v-btn>
                                    </template>
                                    <RangeSlider :range="options.avg_length_range"></RangeSlider>
                                </v-menu>
                            </template>

                            <template v-slot:header.avg_plddt="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" >
                                            {{ header.text }}
                                        </v-btn>
                                    </template>
                                    <RangeSlider :range="options.avg_plddt_range"></RangeSlider>
                                </v-menu>
                            </template>

                            <template v-slot:header.n_mem="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" >
                                            {{ header.text }}
                                        </v-btn>
                                    </template>
                                    <RangeSlider :range="options.n_mem_range"></RangeSlider>
                                </v-menu>
                            </template>

                            <template v-slot:header.rep_len="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" >
                                            {{ header.text }}
                                        </v-btn>
                                    </template>
                                    <RangeSlider :range="options.rep_length_range"></RangeSlider>
                                </v-menu>
                            </template>

                            <template v-slot:header.rep_plddt="{ header }">
                                <v-menu
                                    :close-on-content-click="false"
                                    offset-y>
                                    <template v-slot:activator="{ on }">
                                        <v-btn v-on="on" >
                                            {{ header.text }}
                                        </v-btn>
                                    </template>
                                    <RangeSlider :range="options.rep_plddt_range"></RangeSlider>
                                </v-menu>
                            </template>

                        </v-data-table>
                    </template>
                </panel>
            </v-flex>
            <v-flex>
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
import TaxSpan from "./TaxSpan.vue";
import FoldseekSearchButton from "./FoldseekSearchButton.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
import IsDark from './IsDark.vue';
import RangeSlider from './RangeSlider.vue';

export default {
    name: "search",
    components: { 
        Panel,
        FoldseekSearchButton,
        TaxSpan,
        TaxonomyAutocomplete,
        IsDark,
        RangeSlider
    },
    data() {
        return {
            query: "B4DKH6",
            query_GO: "GO:0005524",
            selectedExample: 1,
            tab: 0,
            examples: [
                {id:'A0A849TG76', desc:'predicted \'Transporter\' protein'},
                {id:'B4DKH6', desc:'Bactericidal permeability-increasing protein'},
                {id:'A0A1G5ASE0', desc:'Histone (bacteria)'},
                {id:'A0A1S3QU81', desc:' Gasdermin containing domain'},
            ],
            inSearch: false,
            response: null,
            bundle_original: null,
            total: null,
            page: null,
            error: null,
            headers: [
                {
                    text: "Rep Accession",
                    value: "rep_accession",
                },
                {
                    text: "LCA rank",
                    value: "lca_tax_id.rank"
                },
                // {
                //     text: "LCA",
                //     value: "lca_tax_id.name",
                //     sortable: false,
                // },
                {
                    text: "LCA",
                    value: "lca_tax_id",
                    sortable: false,
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
                    text: "Dark",
                    value: "is_dark",
                    sortable: false,
                },
                {
                    text: "Rep pLDDT",
                    value: "rep_plddt",
                },
                {
                    text: "Rep Length",
                    value: "rep_len",
                },
            ],
            go_search_type: "lower",
            options: {
                search_type: null,
                avg_length_range: [Infinity, 0],
                avg_plddt_range: [Infinity, 0],
                rep_length_range: [Infinity, 0],
                rep_plddt_range: [Infinity, 0],
                n_mem_range: [Infinity, 0],
                showDarkOnly: false,
                tax_id: null,
                is_dark: null,
                totalMembers: null,
            },
            taxAutocompleteDisabled: false,
            range: [5, 5],
        };
    },
    watch : {
        options: {
            handler () {
                this.filterData()
            },
            deep: true,
        }
    },
    computed: {
        windowHeight() {
            if (this.response != null && this.response.length > 0) {
                return 500;
            }
            return Math.max(Math.min(860, (window.innerHeight - 48) * 0.8), 500);
        },
    },
    methods: {
        log(value) {
            console.log(value);
        },
        search() {
            this.inSearch = true;
            this.error = null;
            this.$axios.post("/" + this.query)
                .then(response => {
                    this.$router.push({ name: 'cluster', params: { cluster: response.data[0].rep_accession } })
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.error) {
                        this.error = err.response.data.error;
                    } else {
                        this.error = "Unknown error";
                    }
                })
                .finally(() => {
                    this.inSearch = false;
                });
        },
        GOsearch() {
            this.inSearch = true;
            this.error = null;
            this.$axios.post("/go/" + this.query_GO, 
                {
                    itemsPerPage: 15, page: 1,
                    go_search_type: this.go_search_type
                })
                .then(res => {
                    this.response = res.data.result;
                    console.log(this.response)
                    this.options.search_type = "go";
                    this.bundle_original = res.data.result;
                    this.init_range();
                }
                );
        },
        foldseekResult(result) {
            this.response = result;
            this.options.search_type = "foldseek";
            this.bundle_original = result;
            this.init_range();
            this.$nextTick(() => {
                this.$refs.results.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                    inline: "nearest"
                })
            })
        },
        filterData () {
            this.loading = true;
            const options = {};

            if (this.options.search_type === 'go') {
                options['query_GO'] = this.query_GO;
                options["go_search_type"] = this.go_search_type;
                options["bundle"] = this.bundle_original;
            }
            else if (this.options.search_type === 'foldseek') {
                options["bundle"] = this.bundle_original;
            }

            let request = Object.assign({}, this.options, options);

            this.$axios.post("/search/filter" , request)
                .then(response => {
                    this.response = response.data.result;
                    this.options.totalMembers = response.data.total;
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        },
        init_range() {
            this.bundle_original.forEach(x => {
                if (x.avg_len < this.options.avg_length_range[0]) {
                    this.options.avg_length_range[0] = x.avg_len;
                }
                if (x.avg_len > this.options.avg_length_range[1]) {
                    this.options.avg_length_range[1] = x.avg_len;
                }
                if (x.rep_len < this.options.rep_length_range[0]) {
                    this.options.rep_length_range[0] = x.rep_len;
                }
                if (x.rep_len > this.options.rep_length_range[1]) {
                    this.options.rep_length_range[1] = x.rep_len;
                }
                if (x.avg_plddt < this.options.avg_plddt_range[0]) {
                    this.options.avg_plddt_range[0] = x.avg_plddt;
                }
                if (x.avg_plddt > this.options.avg_plddt_range[1]) {
                    this.options.avg_plddt_range[1] = x.avg_plddt;
                }
                if (x.rep_plddt < this.options.rep_plddt_range[0]) {
                    this.options.rep_plddt_range[0] = x.rep_plddt;
                }
                if (x.rep_plddt > this.options.rep_plddt_range[1]) {
                    this.options.rep_plddt_range[1] = x.rep_plddt;
                }
                if (x.n_mem < this.options.n_mem_range[0]) {
                    this.options.n_mem_range[0] = x.n_mem;
                }
                if (x.n_mem > this.options.n_mem_range[1]) {
                    this.options.n_mem_range[1] = x.n_mem;
                }
            });
        }
    }
};
</script>

<style scoped>
#search-container {
    padding:0px;
}
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

.search-select >>> .v-tabs-bar {
    height: 36px;
}

.search-select >>> .v-tab {
    text-transform: none;
    padding: 0 24px
}
.v-tabs-items {
    background-color: transparent !important;
}

.v-parallax {
    transition: height 0.25s;
}

</style>
