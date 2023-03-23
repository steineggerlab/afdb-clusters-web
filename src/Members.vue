<template>
    <v-data-table
        :headers="headers"
        :items="members"
        :options.sync="options"
        :server-items-length="totalMembers"
        :loading="loading"
    >
         <template v-slot:item.structure="prop">
            <StructureViewer :cluster="prop.item.accession" :width="50" :height="50" :toolbar="false" bgColorDark="#1E1E1E"></StructureViewer>
        </template>
        <template v-slot:item.tax_id="prop">
            <TaxSpan :taxonomy="prop.value"></TaxSpan>
        </template>
    </v-data-table>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import StructureViewer from "./StructureViewer.vue";

export default {
    name: "members",
    components: {
    TaxSpan,
    StructureViewer,
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
                    value: "accession",
                    sortable: false,
                },
                {
                    text: "Length",
                    value: "len",
                    sortable: false,
                },
                {
                    text: "Flag",
                    value: "flag",
                    sortable: false,
                },
                {
                    text: "Tax ID",
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
    },
    methods: {
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