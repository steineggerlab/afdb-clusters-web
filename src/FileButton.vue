<template>
    <v-btn 
        v-bind="$attrs"
        type="button"
        class="btn btn--raised btn--file"
        style="position: relative;"
        :block="$vuetify.breakpoint.xsOnly"
        @drop="fileDrop($event)"
        >
        <div class="btn__content" aria-hidden>
            {{ label }}
        </div>
        <input :aria-label="label" type="file" v-on:change="upload" :accept="accept">
    </v-btn>
</template>

<script>
export default {
    name: 'file-button',
    props: ['label', 'accept'],
    methods: {
        upload(event) {
            var files = this.$el.getElementsByTagName('input')[0].files;
            this.$emit('upload', files);
        },
        fileDrop(event) {
            event.preventDefault();
            event.stopPropagation();

            var dataTransfer = event.dataTransfer || event.target;
            if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
                this.$emit('upload', dataTransfer.files);
            }
        },
    }
}
</script>

<style scoped>
.btn--file {
    position: relative;
    overflow: hidden;
}

.btn >>> .v-btn__content {
    height: 100%;
    width: 100%;
}

.btn--file input[type=file] {
    position: absolute;
    top: 0;
    right: 0;
    left: -23px;
    bottom: 0;
    min-width: 100%;
    min-height: 100%;
    font-size: 100px;
    text-align: right;
    filter: alpha(opacity=0);
    opacity: 0;
    outline: none;
    background: white;
    cursor: inherit;
    display: block;
}
</style>