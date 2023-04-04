<template>
    <div>
    <FileButton
        label="Upload PDB File"
        @upload="upload"
        :disabled="inSearch"
        :loading="inSearch"
        x-large
        :color="this.error ? 'error' : 'primary'"
        accept=".pdb,.mmcif,.cif,.mcif,chemical/x-pdb,chemical/x-cif,chemical/x-mmcif"
        v-bind="$attrs"
    >
    </FileButton>
    <div v-if="error">
        <small>Error: {{ error }}</small>
    </div>
    </div>
</template>

<script>
import FileButton from "./FileButton.vue";

export default {
    name: "search",
    components: { 
        FileButton,
    },
    data() {
        return {
            inSearch: false,
            response: [],
            error: null,
        };
    },
    methods: {
        log(value) {
            console.log(value);
        },
        upload(files) {
            this.inSearch = true;
            this.error = null;
            var reader = new FileReader();
            reader.onload = e => {
                this.$axios.post("/foldseek", e.target.result, {
                    headers: { 'Content-Type': 'text/plain' },
                    timeout: 0,
                })
                .then(response => {
                    this.$emit('response', response.data);
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.error) {
                        this.error = err.response.data.error;
                    } else {
                        this.error = "Unknown error";
                    }
                })
                .finally(() => {
                    this.inSearch = false;
                });
            };
            reader.readAsText(files[0]);
        },
    }
};
</script>