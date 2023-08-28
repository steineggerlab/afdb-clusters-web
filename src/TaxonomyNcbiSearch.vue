<template>
    <v-tooltip open-delay="300" top>
        <template v-slot:activator="{ on }">
            <v-autocomplete
                outlined
                :value="value"
                label="Taxonomic name"
                placeholder="Start typing scientific name to search"
                hide-no-data
                :items="items"
                :loading="isLoading"
                :search-input.sync="search"
                style="max-width: 400px; margin: 0 auto;"
                @input="change"
                return-object
                auto-select-first
                :allow-overflow="false"
                dark
                v-bind="$attrs"
                v-on="$listeners"
            >
                <template v-slot:item="{ item }">
                    {{ item.text }}<template v-if="item.common_name">&nbsp;({{ item.common_name }})</template>
                </template>
            </v-autocomplete>
        </template>
        <span>Restrict results to taxonomic clade</span>
    </v-tooltip>
</template>

<script>
import { create } from 'axios';
import { debounce } from './lib/debounce';

export default {
  props: ['value'],
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
          this.items = [ this.value ];
      },
      search (val) {
          val && val.length > 2 && val !== this.value && this.querySelections(val)
      },
  },
  methods: {
      change(taxId) {
        this.$emit('input', taxId);
      },
      querySelections: debounce(function (name) {
          this.loading = true;
          // make a new axios instance to not leak the electron access token
          const axios = create();
          axios.get("https://api.ncbi.nlm.nih.gov/datasets/v2alpha/taxonomy/taxon_suggest/" + encodeURIComponent(name) + "?tax_rank_filter=higher_taxon")
              .then(response => {
                  if (response.status == 200 && response.data.hasOwnProperty("sci_name_and_ids")) {
                      this.items = response.data.sci_name_and_ids.map((el) => {
                          return { text: el.sci_name, value: el.tax_id, common_name: el.common_name }
                      });
                  }
              }).finally(() => { this.loading = false; });
      }, 500, false)
  },
}
</script>

<style>
</style>