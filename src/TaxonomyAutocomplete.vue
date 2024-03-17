<template>
    <v-autocomplete
        :disabled="disabled"
        :allow-overflow="false"
        :items="items"
        :loading="isLoading"
        :search-input.sync="search"
        :value="value"
        @input="change"
        placeholder="Taxonomic filter"
        hide-no-data
        return-object
        auto-select-first
        clearable
    >
        <template v-slot:item="{ item }">
                {{ item.text }} ({{ item.rank }})
        </template>
    </v-autocomplete>
</template>

<script>
import { debounce } from './lib/debounce';

export default {
    props: [
        'value', 'cluster', 'urlFunction', 'disabled', 'options',
    ],
    data() {
        return {
            items: [],
            isLoading: false,
            search: null,
        }
    },
    mounted() {
        this.items = [ this.value ];
    },
    watch: {
        value(val) {
            this.items = [ val ];
        },
        search(val) {
            if (val && val.length > 2 && val !== this.value) {
                this.querySelections(val)
            }
        },
    },
    methods: {
        log(value) {
            console.log(value);
            return value;
        },
        change(taxId) {
            this.$emit('input', taxId);
        },
        querySelections: debounce(function (name) {
            this.loading = true;
            const url = this.urlFunction(encodeURIComponent(this.cluster), encodeURIComponent(name));
            this.$axios.get(url, this.options)
                .then(response => {
                    this.items = response.data.map(item => {
                        return { 
                            text: item.name, 
                            value: item.id,
                            rank: item.rank,
                        }
                    });
                }).finally(() => { this.loading = false; });
        }, 500, false)
    },
}
</script>

<style>
</style>
