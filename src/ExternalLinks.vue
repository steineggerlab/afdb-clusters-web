<template>
    <v-menu
        :close-on-content-click="false">
        <template v-slot:activator="{ on }">
            <slot v-if="$slots['accession']" name="accession"></slot>
            <template v-else>{{ accession }}</template>&nbsp;<v-btn v-on="on" plain text small icon>
                <v-icon small>
                    {{ $MDI.OpenInNew }}
                </v-icon>
            </v-btn>
        </template>
        <v-list>
            <v-list-item :href="'https://www.uniprot.org/uniprotkb/' + accession" target="_blank" rel="noopener">
                <v-list-item-content>
                    <v-list-item-title>UniProt</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
            <v-list-item :href="'https://uniprot3d.org/atlas/AFDB90v4/#' + accession" target="_blank" rel="noopener">
                <v-list-item-content>
                    <v-list-item-title>UniProt3D Atlas</v-list-item-title>
                </v-list-item-content>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    name: "externallinks",
    props: {
        accession: {
            type: String,
            required: true,
        },
    },
};
</script>
