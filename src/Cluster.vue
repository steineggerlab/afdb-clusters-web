<template>

<v-row style="padding:2em;">
    <v-flex xs12 md8>
    <panel>
        <template slot="header">
            Cluster: {{ response ? response.rep_accession : "Loading..." }}
        </template>
        <template slot="content" v-if="response">
            <dl>
                <div>
                <dt>
                    Representative accession
                </dt>
                <dd>
                    <UniprotLink :accession="response.rep_accession"></UniprotLink>
                </dd>
                </div>
                <div>
                <dt>
                    Representative length
                </dt>
                <dd>
                    {{ response.rep_len }} aa
                </dd>
                </div>
                <div>
                <dt>
                    Representative pLDDT
                </dt>
                <dd>
                    {{ response.rep_plddt.toFixed(2) }}
                </dd>
                </div>
                <div>
                <dt>
                    Dark cluster
                </dt>
                <dd>
                    {{ response.is_dark ? 'yes' : 'no' }}
                </dd>
                </div>
                <div>
                <dt>
                    Average length
                </dt>
                <dd>
                    {{ response.avg_len.toFixed(2) }} aa
                </dd>
                </div>
                <div>
                <dt>
                    Average pLDDT
                </dt>
                <dd>
                    {{ response.avg_plddt.toFixed(2) }}
                </dd>
                </div>
                <div>
                <dt>
                    Number of members
                </dt>
                <dd>
                    {{ response.n_mem }}
                </dd>
                </div>
                <div>
                <dt>
                    Lowest common ancestor
                </dt>
                <dd>
                    <TaxSpan :taxonomy="response.lca_tax_id"></TaxSpan>
                </dd>
                </div>
                <div>
                <dt>
                    Lineage
                </dt>
                <dd>
                    <template v-for="(taxonomy, index) in response.lineage" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.lineage.length -1)"> &#187;&nbsp;</template></template>
                </dd>
                </div>
            </dl>

        </template>
    </panel>
    </v-flex>

    <v-flex xs12 md4>
    <Panel style="margin-left: 1em;">
        <template slot="header">
            Representative structure
        </template>
        <template slot="content" v-if="response">
            <StructureViewer v-if="cluster" :cluster="cluster" bgColorDark="#1E1E1E"></StructureViewer>
        </template>
    </Panel>
    </v-flex>

    <v-flex xs12>
    <Panel style="margin-top: 1em;">
        <template slot="header">
            Cluster members
        </template>
        <template slot="content" v-if="response">
            <Members v-if="cluster" :cluster="cluster"></Members>
        </template>
    </Panel>
    </v-flex>

    <v-flex xs12>
    <Panel style="margin-top: 1em;">
        <template slot="header">
            Similar clusters
        </template>
        <template slot="content" v-if="response">
            <Similars v-if="cluster" :cluster="cluster"></Similars>
        </template>
    </Panel>
    </v-flex>
</v-row>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";
import Members from "./Members.vue";
import TaxSpan from "./TaxSpan.vue";
import UniprotLink from "./UniprotLink.vue";
import Similars from "./Similars.vue";

export default {
    name: "cluster",
    components: {
    Panel,
    StructureViewer,
    Members,
    TaxSpan,
    UniprotLink,
    Similars
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
    watch: {
        $route(to, from) {
            if (to.params.cluster === from.params.cluster) {
                return;
            }
            this.fetchData();
        }
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

<style scoped>
dl {
  display: grid;
  padding-top: .25em;
  padding-bottom: .25em;
  grid-gap: 1em;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

dt {
    font-weight: bold;
}
</style>
