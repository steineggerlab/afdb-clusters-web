<template>

<v-row style="margin:1em;">
    <v-flex xs12 md8>
    <panel>
        <template slot="header" v-if="response">
            Entry: {{ response ? response.rep_accession : "Loading..." }}
        </template>

        <template v-if="response && response.warning == true" slot="toolbar-extra">
            <v-chip color="error">Warning</v-chip>
        </template>

        <template slot="content" v-if="response">
            <h3>Representative summary</h3>
            <dl class="dl-4">
                <div>
                <dt>
                    Accession
                </dt>
                <dd>
                    <ExternalLinks :accession="response.rep_accession"></ExternalLinks><br>
                    {{ response.description }}
                </dd>
                </div>
                <div>
                <dt>
                    Length
                </dt>
                <dd>
                    {{ response.rep_len }} aa
                </dd>
                </div>
                <div>
                <dt>
                    pLDDT
                </dt>
                <dd>
                    {{ response.rep_plddt.toFixed(2) }}
                </dd>
                </div>
                <div>
                <dt>
                    Singleton cluster
                </dt>
                <dd>
                    {{ response.is_dark ? 'yes' : 'no' }}
                </dd>
                </div>
                <div style=" grid-area: 2 / 1 / 3 / 5;">
                <dt>
                    Taxonomy
                </dt>
                <dd>
                    <template v-for="(taxonomy, index) in response.rep_lineage" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.rep_lineage.length -1)"> &#187;&nbsp;</template></template>
                </dd>
                <dt v-if="response.hosts.length > 0">
                    Host
                </dt>
                <dd v-if="response.hosts.length > 0">
                    <template v-for="(taxonomy, index) in response.hosts" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.hosts.length -1)"> ,&nbsp;</template></template>
                </dd>
                </div>
                </dl>
                <v-divider  style="margin-top:0.5em"></v-divider>
                <h3 style="margin-top:1em">
                    UniRef cluster summary
                    <!--<v-tooltip top>
                        <template v-slot:activator="{ on }">
                            <span v-on="on">
                                <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                            </span>
                        </template>
                        <span>
                            These values are computed among the members with the <strong>clustered step</strong> AFDB/Foldseek.
                        </span>
                    </v-tooltip>-->
                </h3>
                <dl class="dl-4">
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
                    Average length
                </dt>
                <dd>
                    {{ response.avg_len.toFixed(2) }} aa
                </dd>
                </div>
                <div>
                <!-- <dt>
                    Average pLDDT
                </dt>
                <dd>
                    {{ response.avg_plddt.toFixed(2) }}
                </dd> -->
                </div>
                <div style=" grid-area: 2 / 1 / 3 / 5;">
                <dt>
                    Lowest common ancestor and lineage
                </dt>
                <dd>
                    <template v-for="(taxonomy, index) in response.lineage" ><TaxSpan :taxonomy="taxonomy" :key="taxonomy.id"></TaxSpan><template v-if="index < (response.lineage.length -1)"> &#187;&nbsp;</template></template>
                </dd>
                </div>
                <!-- <div style=" grid-area: 3 / 1 / 3 / 5;">
                    <dt>Annotations</dt>
                    <dd>
                        <Annotations :cluster="$route.params.cluster"></Annotations>
                    </dd>
                </div> -->
            </dl>
            <template v-if="response && response.warning == true">
                <v-divider  style="margin-top:0.5em"></v-divider>
                <h3 style="margin-top:1em; color: #F44336; text-decoration: underline;">
                    Warning!
                </h3>
                <p>
                    This cluster was wrongly merged with another cluster. We are working on a fix.
                </p>
            </template>
        </template>
    </panel>
    </v-flex>
    <v-flex xs12 md4>
    <Panel class="repr-structure">
        <template slot="header">
            Representative structure
        </template>
        <template slot="content" v-if="response">
            <StructureViewer v-if="$route.params.cluster" :cluster="$route.params.cluster" :second="second" bgColorDark="#2e2e2e" @reset="second = ''"></StructureViewer>
        </template>
p    </Panel>
    </v-flex>

    <v-flex xs12>
        <Members :cluster="$route.params.cluster" @select="(accession) => second = accession"></Members>
    </v-flex>

    <v-flex xs12>
        <Similars :cluster="$route.params.cluster" @select="(accession) => second = accession"></Similars>
    </v-flex>

    <v-flex xs12 class="mt-3">
        <v-card rounded="0">
            <v-flex>
            <v-card-title primary-title class="pb-0 mb-0">
                <div class="text-h5 mb-0">Reference</div>
            </v-card-title>
            <v-card-title primary-title class="pt-0 mt-0">
                <p class="text-subtitle-1 mb-0" style="word-break: break-word;">
                    Kim&nbsp;R, Levy&nbsp;Karin&nbsp;E, Steinegger&nbsp;M.
                    <a href="https://www.biorxiv.org/content/10.1101/2024.09.08.611582v1" target="_blank" rel="noopener">BFVD - a large repository of predicted viral protein structures.</a>
                    bioRxiv,&nbsp;2024.09.08.61158,&nbsp;2024.
                </p>
            </v-card-title>
            </v-flex>
        </v-card>
    </v-flex>
</v-row>
</template>

<script>
import Panel from "./Panel.vue";
import StructureViewer from "./StructureViewer.vue";
import Members from "./Members.vue";
import TaxSpan from "./TaxSpan.vue";
import ExternalLinks from "./ExternalLinks.vue";
import Similars from "./Similars.vue";
// import Annotations from "./Annotations.vue";

export default {
    name: "cluster",
    components: {
    Panel,
    StructureViewer,
    Members,
    TaxSpan,
    ExternalLinks,
    Similars,
    // Annotations,
},
    data() {
        return {
            cluster: null,
            response: null,
            fetching: false,
            second: "",
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

            this.$axios.get("/cluster/" + this.$route.params.cluster)
                .then(response => {
                    this.response = response.data;
                })
                .catch((result) => {
                    if (!result || !result.response || result.response.status != 404) {
                        return;
                    }
                    this.$axios.get("/" + this.$route.params.cluster)
                        .then(response => {
                            this.$router.replace({ name: "cluster", params: { cluster: response.data[0].rep_accession } });
                        })
                        .catch(() => {});
                })
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
  padding-bottom: 1em;
  grid-gap: 1em;
}

.dl-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.dl-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

dt {
    font-weight: bold;
}

@media screen and (min-width: 961px) {
    .repr-structure {
        margin-left: 1em;
    }
}

@media screen and (max-width: 960px) {
    .repr-structure {
        margin-top: 1em;
    }
}
</style>
