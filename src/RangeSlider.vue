<template>
  <v-card style="padding: 2em; width: 250px;">
    <h3>Filter by</h3>
    <v-text-field
        :model-value="range[0]"
        :value="range[0]"
        @change="$set(range, 0, $event)"
        label="min"
        single-line
        type="number"
        variant="outlined"
        density="compact"
        style="width: 80px; display: inline-block;">
    </v-text-field>
    ~
    <v-text-field
        :model-value="range[1]"
        :value="range[1]"
        label="min"
        single-line
        type="number"
        variant="outlined"
        density="compact"
        style="width: 80px; display: inline-block;"
        @change="$set(range, 1, $event)">
    </v-text-field>
</v-card>
</template>

<script>

export default {
  name: "RangeSlider",
  props: ["range"],
  computed: {
  }
}

</script>