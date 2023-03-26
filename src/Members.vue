<template>
    <v-data-table
        :headers="headers"
        :items="members"
        :options.sync="options"
        :server-items-length="totalMembers"
        :loading="loading"
    >
        <template v-slot:item.accession="prop">
            <UniprotLink :accession="prop.value"></UniprotLink>
        </template>
        <template v-slot:item.structure="prop">
            <StructureViewer :cluster="prop.item.accession" :width="50" :height="50" :toolbar="false" bgColorDark="#1E1E1E"></StructureViewer>
        </template>
        <template v-slot:header.tax_id="{ header }">
                <TaxonomyAutocomplete :cluster="cluster" v-model="options.tax_id" :urlFunction="(a, b) => '/cluster/' + a + '/members/taxonomy/' + b"></TaxonomyAutocomplete>
        </template>
        <template v-slot:item.tax_id="prop">
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
    name: "members",
    components: {
        TaxSpan,
        StructureViewer,
        UniprotLink,
        TaxonomyAutocomplete,
    },
    props: ["cluster"],
    data() {
        return {
            taxonomyFilter: null,
            headers: [
                {
                    text: "Structure",
                    value: "structure",
                    sortable: false,
                },
                {
                    text: "Accession",
                    value: "accession",
                    sortable: false,
                },
                // {
                //     text: "Length",
                //     value: "len",
                //     sortable: false,
                // },
                {
                    text: "Flag",
                    value: "flag",
                    sortable: false,
                },
                {
                    text: "Taxonomy",
                    value: "tax_id",
                    sortable: false,
                },
            ],
            members: [],
            totalMembers: 0,
            loading: false,
            options: {},
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
        taxonomySearch() {
            return this.taxonomyFilter ? String(this.taxonomyFilter.value) : null;
        }
    },
    methods: {
        log(value) {
            console.log(value);
            return value;
        },
        fetchData() {
            this.loading = true;
            const cluster = this.$route.params.cluster;
            if (!cluster) {
                return;
            }

            this.$axios.post("/cluster/" + cluster + "/members", this.options)
                .then(response => {
                    this.members = response.data.result;
                    this.totalMembers = response.data.total;
                })
                .catch(() => {})
                .finally(() => {
                    this.loading = false;
                });
        }
    }
}

</script>