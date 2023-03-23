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
                    <TaxSpan :taxonomy="response.lca_tax_id"></TaxSpan>
                </dd>
                <dt>
                    Lineage
                </dt>
                <dd>
                    <template v-for="(taxonomy, index) in response.lineage" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.lineage.length -1)">&nbsp;&#187;&nbsp;</template></template>
                </dd>
            </dl>

            <StructureViewer v-if="cluster" :cluster="cluster" bgColorDark="#1E1E1E"></StructureViewer>

            <h2>Cluster members</h2>
            <Members v-if="cluster" :cluster="cluster"></Members>
        </template>
    </panel>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";
import Members from "./Members.vue";
import TaxSpan from "./TaxSpan.vue";

export default {
    name: "cluster",
    components: { 
        Panel,
        StructureViewer,
        Members,
        TaxSpan,
    },
    data() {
        return {
            response: null,
            cluster: null,
            fetching: false,
        }
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        log(value) {
            console.log(value);
        },
        fetchData() {
            this.fetching = true;
            this.cluster = this.$route.params.cluster;
            if (!this.cluster) {
                return;
            }

            this.$axios.post("/cluster/" + this.cluster)
                .then(response => {
                    this.response = response.data;
                })
                .catch(() => {})
                .finally(() => {
                    this.fetching = false;
                });
        }
    }
}

</script>