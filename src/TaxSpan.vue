<template>
    <a v-if="taxonomy" :href="'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=' + taxonomy.id" :title="'Taxonomic ID: ' + taxonomy.id + ' Rank: ' + taxonomy.rank">{{ taxonomy.name }}</a>
    <span v-else>Unknown</span>
</template>

<script>
export default {
    name: "taxspan",
    props: {
        taxonomy: {
            type: [Object, null],
            default: null,
        },
    },
}
</script>