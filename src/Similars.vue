<template>
<Panel style="margin-top: 1em;" collapsible>
    <template slot="header">
        Similar clusters
    </template>

    <template slot="toolbar-extra">
        <v-menu offset-y>
            <template v-slot:activator="{ on }">
                <v-btn plain v-on="on">
                    <v-icon class="mr-1">{{ $MDI.Export }}</v-icon>
                    Export
                </v-btn>
            </template>
            <v-list>
                <v-list-item :href="`${$axios.defaults.baseURL}/cluster/${$route.params.cluster}/similars?format=accessions&${requestOptions.params.toString()}`" target="_blank">
                    <v-list-item-content>
                        <v-list-item-title>Accessions</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
                <v-list-item :href="`${$axios.defaults.baseURL}/cluster/${$route.params.cluster}/similars?format=fasta&${requestOptions.params.toString()}`" target="_blank">
                    <v-list-item-content>
                        <v-list-item-title>FASTA</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
        </v-menu>
    </template>

<template slot="content" v-if="$route.params.cluster">
    <v-data-table
        :headers="headers"
        :items="entries"
        :options.sync="options"
        :server-items-length="totalEntries"
        :loading="loading"
        :footer-props="{
            'items-per-page-options': [10, 20, 50, 100, -1],
        }"
    >
        <template v-slot:item.rep_accession="prop">
            <router-link :to="{ name: 'cluster', params: { cluster: prop.value }}">{{ prop.value }}</router-link><br>
            {{ prop.item.description }}
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
        <template v-slot:header.structure="{ header }">
            {{ header.text }}
            <v-tooltip top>
                <template v-slot:activator="{ on }">
                    <span v-on="on">
                        <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                    </span>
                </template>
                <span>
                   Click on a structure to superpose it on to the cluster representative in the structure viewer
                </span>
            </v-tooltip>
        </template>
        <template v-slot:item.structure="prop">
            <div v-ripple="{ class: `primary--text` }" style="text-align: center; cursor: pointer;" @click="$emit('select', prop.item.rep_accession)">
                <img :src="getImage(prop.item.rep_accession)" style="height:75px"/>
            </div>
        </template>

        <template v-slot:header.lca_tax_id="{ header }">
                <TaxonomyAutocomplete
                    :cluster="cluster"
                    v-model="options.tax_id"
                    :urlFunction="(a, b) => '/cluster/' + a + '/similars/taxonomy/' + b"
                    :options="requestOptions"
                    :disabled="taxAutocompleteDisabled">
                </TaxonomyAutocomplete>
        </template>

        <template v-slot:item.lca_tax_id="prop">
            <TaxSpan :taxonomy="prop.value"></TaxSpan>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-chip title="Search with Foldseek" :href="'https://search.foldseek.com/search?accession=' + item.rep_accession + '&source=AlphaFoldDB'">
                <v-img :src="require('./assets/marv-foldseek-small.png')" max-width="16"></v-img>
            </v-chip>
        </template>
    </v-data-table>
</template>
</Panel>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import StructureViewer from "./StructureViewer.vue";
import ExternalLinks from "./ExternalLinks.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
import Sankey from "./Sankey.vue";
import ImageMixin from './ImageMixin';
import Panel from "./Panel.vue";

export default {
    name: "Similars",
    components: {
        Panel,
        TaxSpan,
        StructureViewer,
        ExternalLinks,
        TaxonomyAutocomplete,
        Sankey,
    },
    props: ["cluster"],
    mixins: [ImageMixin],
    data() {
        return {
            headers: [
                {
                    text: "Structure",
                    value: "structure",
                    sortable: false,
                },
                {
                    text: "Accession",
                    value: "rep_accession",
                },
                {
                    text: "Average length",
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
                    text: "Lowest common ancestor",
                    value: "lca_tax_id",
                    sortable: false,
                },
                {
                    text: "Dark cluster",
                    value: "is_dark",
                },
                {
                    text: "Rep pLDDT",
                    value: "rep_plddt",
                },
                {
                    text: "Rep length",
                    value: "rep_len",
                },
                {
                    text: "E-value",
                    value: "evalue",
                },
                { text: 'Actions', value: 'actions', sortable: false },
            ],
            entries: [],
            totalEntries: 0,
            loading: false,
            options: {
                tax_id: null,
            },
            taxAutocompleteDisabled: false,
        }
    },
    watch: {
        options: {
            handler () {
                this.fetchData()
            },
            deep: true,
        },
        cluster() {
            this.fetchData();
        }
    },
    computed: {
        requestOptions() {
            let copy = JSON.parse(JSON.stringify(this.options));
            if (copy.tax_id) {
                copy.tax_id = copy.tax_id.value;
            } else {
                delete copy.tax_id;
            }
            const params = new URLSearchParams(copy);
            params.sort();
            return { params };
        },
    },
    methods: {
        sankeySelect(value) {
            if (value == null) {
                this.options.tax_id = null;
                this.taxAutocompleteDisabled = false;
            } else {
               this.options.tax_id = { value: value.id, text: value.name };
               this.taxAutocompleteDisabled = true;
            }
            // this.fetchData()
        },
        log(value) {
            console.log(value);
            return value;
        },
        fetchData() {
            this.loading = true;
            const cluster = this.cluster;
            if (!cluster) {
                return;
            }
            this.$axios.get("/cluster/" + cluster + "/similars", this.requestOptions)
                .then(response => {
                    this.entries = response.data.similars;
                    this.totalEntries = response.data.total;
                    this.fetchImages(this.entries.map(m => m.rep_accession));
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        }
    }
}

</script>