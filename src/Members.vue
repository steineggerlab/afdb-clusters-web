<template>
    <div>
    <Sankey :cluster="cluster" type="members" @select="sankeySelect"></Sankey>
    <v-data-table
        :headers="headers"
        :items="members"
        :options.sync="options"
        :server-items-length="totalMembers"
        :loading="loading"
    >

        <template v-slot:item.accession="prop">
            <UniprotLink :accession="prop.value"></UniprotLink><br>
            {{ prop.item.description }}
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
            <div v-ripple="{ class: `primary--text` }" style="text-align: center; cursor: pointer;" @click="$emit('select', prop.item.accession)">
                <img :src="getImage(prop.item.accession)" style="height:75px"/>
            </div>
        </template>
        <template v-slot:item.flag="prop">
            <Fragment :flag="prop.value"></Fragment>
        </template>
        <template v-slot:header.flag="{ header }">
            <v-menu
                :close-on-content-click="false"
                offset-y>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" :outlined="options.flagFilter != null">
                        {{ header.text }}&nbsp;
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
                    </v-btn>
                </template>

                <v-card style="padding: 2em; width: 250px;">
                    <h3>Filter by</h3>
                    <v-chip-group column v-model="options.flagFilter">
                        <Fragment :flag="1"></Fragment>
                        <Fragment :flag="2"></Fragment>
                        <Fragment :flag="3"></Fragment>
                        <Fragment :flag="4"></Fragment>
                    </v-chip-group>
                </v-card>
            </v-menu>
        </template>
        <template v-slot:header.tax_id="{ header }">
                <TaxonomyAutocomplete :cluster="cluster" v-model="options.tax_id" :urlFunction="(a, b) => '/cluster/' + a + '/members/taxonomy/' + b" :disabled="taxAutocompleteDisabled"></TaxonomyAutocomplete>
        </template>
        <template v-slot:item.tax_id="prop">
            <TaxSpan :taxonomy="prop.value"></TaxSpan>
        </template>

        <template v-slot:item.actions="{ item }">
            <v-chip title="Search with Foldseek" :href="'https://search.foldseek.com/search?accession=' + item.accession + '&source=AlphaFoldDB'">
                <v-img :src="require('./assets/marv-foldseek-small.png')" max-width="16"></v-img>
            </v-chip>
        </template>
    </v-data-table>
    </div>
</template>

<script>
import TaxSpan from "./TaxSpan.vue";
import StructureViewer from "./StructureViewer.vue";
import UniprotLink from "./UniprotLink.vue";
import TaxonomyAutocomplete from "./TaxonomyAutocomplete.vue";
import Fragment from "./Fragment.vue";
import Sankey from './Sankey.vue';


export default {
    name: "members",
    components: {
        TaxSpan,
        StructureViewer,
        UniprotLink,
        TaxonomyAutocomplete,
        Fragment,
        Sankey,
    },
    props: ["cluster"],
    data() {
        return {
            headers: [
                {
                    text: "Structure",
                    value: "structure",
                    sortable: false,
                    width: "10%",
                },
                {
                    text: "Accession",
                    value: "accession",
                    sortable: false,
                    width: "35%",
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
                    width: "10%",
                },
                {
                    text: "Taxonomy",
                    value: "tax_id",
                    sortable: false,
                    width: "40%",
                },
                {
                    text: 'Actions',
                    value: 'actions',
                    sortable: false,
                    width: "10%",
                },
            ],
            members: [],
            totalMembers: 0,
            loading: false,
            options: {},
            images: [],
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
    methods: {
        sankeySelect(value) {
            if (value == null) {
                this.options.tax_id = null;
                this.taxAutocompleteDisabled = false;
            } else {
               this.options.tax_id = { value: value.id, text: value.name };
               this.taxAutocompleteDisabled = true;
            }
            this.fetchData()
        },
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