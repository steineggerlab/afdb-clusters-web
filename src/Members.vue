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
            <img :src="getImage(prop.item.accession)" style="height:75px"/>
        </template>
        <template v-slot:item.flag="prop">
            <Fragment :flag="prop.value"></Fragment>
        </template>
        <template v-slot:header.flag="{ header }">
            {{ header.text }}
            <v-tooltip top>
                <template v-slot:activator="{ on }">
                    <span v-on="on">
                        <v-icon v-on="on">{{ $MDI.HelpCircleOutline }}</v-icon>
                    </span>
                </template>
                <span>
                    <img width="600" src="./assets/cluster_step.jpg"><br>
                    AFDB/Foldseek: Clustered with structural similarity<br>
                    AFDB50/Mmseqs: Clustered at sequence identity 50%<br>
                    Fragment: Removed fragments among AFDB50<br>
                    Singleton: Removed singletons after fragment removal
                </span>
            </v-tooltip>
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
import Fragment from "./Fragment.vue";

export default {
    name: "members",
    components: {
        TaxSpan,
        StructureViewer,
        UniprotLink,
        TaxonomyAutocomplete,
        Fragment,
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
                    text: "Clustered step",
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
    computed: {
        taxonomySearch() {
            return this.taxonomyFilter ? String(this.taxonomyFilter.value) : null;
        },
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
            const cluster = this.$route.params.cluster;
            if (!cluster) {
                return;
            }

            this.$axios.post("/cluster/" + cluster + "/members", this.options)
                .then(response => {
                    this.members = response.data.result;
                    for (let i = 0; i < this.images.length; i++) {
                        URL.revokeObjectURL(this.images[i].url);
                    }
                    this.images = [];
                    this.totalMembers = response.data.total;
                    for (let i = 0; i < this.members.length; i++) {
                        const accession = this.members[i].accession;
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