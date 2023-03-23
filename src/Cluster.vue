<template>
    <panel>
        <template slot="header">
            Cluster: {{ response ? response.rep_accession : "Loading..." }}
        </template>
        <template slot="content" v-if="response">
            <dl>
                <dt>
                    Representative Accession
                </dt>
                <dd>
                    {{ response.rep_accession }}
                </dd>
                <dt>
                    Representative Length
                </dt>
                <dd>
                    {{ response.rep_len }}
                </dd>
                <dt>
                    Representative Plddt
                </dt>
                <dd>
                    {{ response.rep_plddt }}
                </dd>
                <dt>
                    Is Dark
                </dt>
                <dd>
                    {{ response.is_dark }}
                </dd>
                <dt>
                    Number of Members
                </dt>
                <dd>
                    {{ response.n_mem }}
                </dd>
                <dt>
                    Average Length
                </dt>
                <dd>
                    {{ response.avg_len }}
                </dd>
                <dt>
                    Average Plddt
                </dt>
                <dd>
                    {{ response.avg_plddt }}
                </dd>
                <dt>
                    LCA Tax ID
                </dt>
                <dd>
                    {{ response.lca_tax_id }}
                </dd>
            </dl>

            <StructureViewer :structure="structure"></StructureViewer>
        </template>
    </panel>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";

export default {
    name: "cluster",
    components: { 
        Panel,
        StructureViewer,
    },
    data() {
        return {
            response: null,
            structure: null,
            fetching: false,
        }
    },
    mounted() {
        this.fetchData();
    },
    // watch: {
    //     '$route': function(to, from) {
    //         if (from.path != to.path) {
    //             this.fetchData();
    //         }
    //     }
    // },
    methods: {
        fetchData() {
            this.fetching = true;
            const cluster = this.$route.params.cluster;
            console.log(cluster)
            if (!cluster) {
                return;
            }

            this.$axios.post("/cluster/" + cluster)
                .then(response => {
                    this.response = response.data;
                })
                .catch(() => {})
                .finally(() => {
                    this.fetching = false;
                });

            this.$axios.get("/structure/" + cluster)
                .then(response => {
                    this.structure = response.data;
                })
                .catch(() => {})
                .finally(() => {
                    this.fetching = false;
                });
        }
    }
}

</script>