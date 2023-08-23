export default {
    data() {
        return {
            images: [],
        }
    },
    methods: {
        getImage(acession) {
            const image = this.images.find(image => image.accession === acession);
            if (image) {
                return image.url;
            }
            return "";
        },
        fetchImages(accessions) {
            for (let i = 0; i < this.images.length; i++) {
                URL.revokeObjectURL(this.images[i].url);
            }
            this.images = [];
            for (let i = 0; i < accessions.length; i++) {
                this.$axios.get("/structure/" + accessions[i])
                    .then((response) => {
                        this.$nglService.makeImage(response.data.seq, response.data.plddt, response.data.coordinates)
                            .then((image) => {
                                this.images.push({ accession: accessions[i], url: URL.createObjectURL(image) });
                            })
                            .catch(e => {
                                console.log(e);
                            });
                    });
            }
        }
    }
}
