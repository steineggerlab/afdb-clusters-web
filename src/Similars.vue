<template>
    <v-data-table
        :headers="headers"
        :items="entries"
        :options.sync="options"
        :server-items-length="totalEntries"
        :loading="loading"
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
        <template v-slot:item.structure="prop">
            <img :src="getImage(prop.item.rep_accession)" style="height:75px"/>
        </template>

        <template v-slot:header.lca_tax_id="{ header }">
                <TaxonomyAutocomplete :cluster="cluster" v-model="options.tax_id" :urlFunction="(a, b) => '/cluster/' + a + '/similars/taxonomy/' + b"></TaxonomyAutocomplete>
        </template>

        <template v-slot:item.lca_tax_id="prop">
            <TaxSpan :taxonomy="prop.value"></TaxSpan>
        </template>
    </v-data-table>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import StructureViewer from "./StructureViewer.vue";
import UniprotLink from "./UniprotLink.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";

export default {
    name: "Similars",
    components: {
        TaxSpan,
        StructureViewer,
        UniprotLink,
        TaxonomyAutocomplete
    },
    props: ["cluster"],
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
            ],
            entries: [],
            totalEntries: 0,
            loading: false,
            options: {},
            images: []
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
    methods: {
        getImage(acession) {
            const image = this.images.find(image => image.accession === acession);
            if (image) {
                return image.url;
            }
            return "";
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

            this.$axios.post("/cluster/" + cluster + "/similars", this.options)
                .then(response => {
                    this.entries = response.data.similars;
                    this.totalEntries = response.data.total;
                    for (let i = 0; i < this.images.length; i++) {
                        URL.revokeObjectURL(this.images[i].url);
                    }
                    this.images = [];
                    for (let i = 0; i < this.entries.length; i++) {
                        const accession = this.entries[i].rep_accession;
                        this.$axios.get("/structure/" + accession)
                            .then((response) => {
                                this.$nglService.makeImage(response.data.seq, response.data.plddt, response.data.coordinates)
                                    .then((image) => {
                                        this.images.push({ accession: accession, url: URL.createObjectURL(image)});
                                    })
                                    .catch(e => {
                                        console.log(e);
                                    });
                            });
                    }
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        }
    }
}

</script>