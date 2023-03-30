<script>
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

export default {
  name: 'UI',
  data: () => {
    return {items: {
      nodes: [
        { node: 0, name: 'node0', id: 'node0', color: 'red' },
        { node: 1, name: 'node1', id: 'node1', color: 'orange' },
      ],
      links: [
        { source: 'node0', target: 'node1', value: 1, color: 'red' },
      ],
    }}
  },
  watch: {
    items: function() {
      const width = 600;
      const height = 600;
      const margin = {
        left: 100,
        right: 100,
        top: 100,
        bottom: 100,
      }
      const nodeWidth = 30;
      const nodeHeight = 40;
      const nodePadding = 200;

      const ENABLE_LINKS_GRADIENTS = true;

      const svg = d3
        .select(this.$refs.svg)
        .attr('viewBox',
          [0, -100,
            width + margin.left + margin.right,
            height + margin.top + margin.bottom]
        );


      // Color scale used
      var color = d3.scaleOrdinal(d3.schemeCategory10);

      const s = sankey()
        .nodeId((d) => d.name)
        .nodeWidth(nodeWidth)
        .nodePadding(nodeHeight)
        .extent([
          [1, 1],
          [width, height],
        ])(this.items);

      const { nodes, links } = sankey()
        .nodeId((d) => d.name)
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .extent([
          [1, 1],
          [width, height - nodeHeight],
        ])(this.items);

      svg
        .append('g')
        .attr('stroke', '#000')
        .attr('stroke-width', '0')
        .selectAll('rect')
        .data(nodes)
        .join('rect')
        .attr('x', (d) => d.x0)
        .attr('y', (d) => d.y0)
        .attr('height', (d) => d.y1 - d.y0)
        .attr('width', (d) => d.x1 - d.x0)
        .attr('fill', (d) => color.range()[d.node %10])
        .append('title')
        .text((d) => `${d.name}\n${d.value}`);

      const link = svg
        .append('g')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.5)
        .selectAll('g')
        .data(links)
        .join('g');
      //.style("mix-blend-mode", "multiply");

      if (ENABLE_LINKS_GRADIENTS) {
        const gradient = link
          .append('linearGradient')
          .attr('id', (d) => (d.uid = `${d.source.id}-to-${d.target.id}`))
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', (d) => d.source.x1)
          .attr('x2', (d) => d.target.x0);

        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', (d) => color.range()[d.source.node%10]);

        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', (d) => color.range()[d.target.node%10]);
      }

      link
        .append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', (d) =>
          !ENABLE_LINKS_GRADIENTS ? d.color : `url(#${d.uid})`
        )
        .attr('stroke-width', (d) => Math.max(1, d.width));

      link
        .append('title')
        .text((d) => `${d.source.name} → ${d.target.name}\n${d.value}`);

      svg
        .append('g')
        .attr('font-family', 'sans-serif')
        .attr('font-size', '32px')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .attr('x', (d) => d.x0)
        .attr('y', (d) => d.y0)
        // .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .text((d) => d.name);
    }
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.fetching = true;
      this.cluster = this.$route.params.cluster;
      if (!this.cluster) {
          return;
      }

      this.$axios.get("/cluster/" + this.$route.params.cluster + "/sankey")
          .then(response => {
            console.log(response)
            console.log(`${response.data.result}`)
            this.items = response.data.result;
          })
          .catch(() => {})
          .finally(() => {
              this.fetching = false;
          });
      }
  }
};
</script>

<template>
  <svg ref="svg" class="demo" ></svg>
</template>

<style scoped>
svg {
  padding-inline: max(2rem, calc(50% - 24rem));
}
</style>
