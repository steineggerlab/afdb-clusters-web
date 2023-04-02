<template>
    <v-chip-group
        row
        dark
        style="width: 100%; margin: 0 auto; "
    >
        
        <v-chip v-for="item in pfams" :key="item.id" outlined :color="item.color">
            <b>{{ item.pfam }}</b> &emsp; {{ item.hit }}
        </v-chip>
    </v-chip-group>
</template>

<script>

export default {
    name: 'Annotations',
    props: ['cluster'],
    data() {
        return {
            // pfams: {}

        pfams: []
        }
    },
    mounted: function() {
        this.fetchData();
    },
    watch: {
        cluster() {
            this.fetchData();
        },
    },
    methods: {
        fetchData() {
            this.$axios.get("/cluster/" + this.cluster + "/annotations")
                .then(response => {
                    this.pfams = response.data.result.pfams;
                    console.log(this.pfams)
                })
                .catch(() => {console.log('fetch error')})
        },
    }
};
</script>
