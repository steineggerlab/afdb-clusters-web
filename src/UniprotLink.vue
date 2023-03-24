<template>
    <a class="uniprot" :href="'https://www.uniprot.org/uniprotkb/' + accession" target="_blank" rel="noopener">{{ accession }}</a>
</template>

<script>
export default {
    name: "uniprotlink",
    props: {
        accession: {
            type: String,
            required: true,
        },
    },
};
</script>

<style scoped>

a.uniprot::after {
    content: "";
    position: absolute;
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-top: 3px;
    margin-left: 3px;
    background: url(./assets/uniprot-16x16.png);
    background-repeat: no-repeat;
}

</style>