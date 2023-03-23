<template>
    <span :title="'Taxonomic ID: ' + taxonomy.id + ' Rank: ' + taxonomy.rank">{{ taxonomy.name }}</span>
</template>

<script>
export default {
    name: "taxspan",
    props: {
        taxonomy: {
            type: Object,
            required: true,
        },
    },
}
</script>