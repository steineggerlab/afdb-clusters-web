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

function convertToQueryUrl(obj) {
    var params = new URLSearchParams(obj);
    var entries = Object.entries(obj);
    for (var entry in entries) {
        var key = entries[entry][0];
        var value = entries[entry][1];
        if (Array.isArray(value)) {
            params.delete(key);
            value.forEach(function (v) {
                return params.append(key + '[]', v);
            });
        }
    }
    return params.toString();
}

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
                new Promise((resolve, reject) => {
                    this.$axios.post('https://search.foldseek.com/api/ticket', convertToQueryUrl({
                        q: e.target.result,
                        database: ["afdb50", "afdb-swissprot", "afdb-proteome"],
                        mode: "3diaa"
                    }), {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    })
                    .then(result => {
                        let job = result.data;
                        const checkJobStatus = () => {
                            this.$axios.get('https://search.foldseek.com/api/ticket/' + job.id)
                                .then(result => {
                                    job = result.data;
                                    if (job.status === 'PENDING' || job.status === 'RUNNING') {
                                        setTimeout(checkJobStatus, 1000);
                                    } else if (job.status === 'COMPLETE') {
                                        resolve(job.id);
                                    } else {
                                        reject(error);
                                    }
                                });
                        };
                        checkJobStatus();
                    })
                    .catch(error => {
                        reject(error)
                    })
                })
                .then((jobid) => {
                    return this.$axios.get("/foldseek/" + jobid);
                })
                .then((response) => {
                    this.$emit('response', response.data);
                })
                .catch((err) => {
                    if (err.response && err.response.data && err.response.data.error) {
                        this.error = err.response.data.error;
                    } else {
                        console.error(err);
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