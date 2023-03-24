<template>
    <v-data-table
        :headers="headers"
        :items="entries"
        :options.sync="options"
        :loading="loading"
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
        <template v-slot:item.structure="prop">
            <StructureViewer :cluster="log(prop.item.rep_accession)" :width="50" :height="50" :toolbar="false" bgColorDark="#1E1E1E"></StructureViewer>
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

export default {
    name: "Similars",
    components: {
    TaxSpan,
    StructureViewer,
    UniprotLink
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
                {
                    text: "Taxonomy",
                    value: "lca_tax_id",
                    sortable: false,
                },
                {
                    text: "E-value",
                    value: "evalue",
                    sortable: false,
                },
            ],
            entries: [],
            loading: false,
            options: {}
        }
    },
    watch: {
        options: {
            handler () {
                this.fetchData()
            },
            deep: true,
        },
    },
    methods: {
        log(value) {
            console.log(value);
            return value;
        },
        fetchData() {
            this.loading = true;
            const cluster = this.cluster;
            console.log(cluster)
            if (!cluster) {
                return;
            }

            this.$axios.post("/cluster/" + cluster + "/similars")
                .then(response => {
                    console.log(response.data)
                    this.entries = response.data;
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        }
    }
}

</script>