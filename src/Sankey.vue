<template>
    <svg ref="svg"></svg>
</template>

<script>
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';

export default {
    name: 'Sankey',
    props: ['cluster'],
    watch: {
        cluster() {
            this.fetchData();
        },
    },
    methods: {
        fetchData() {
            this.$axios.get("/cluster/" + this.cluster + "/sankey")
                .then(response => {
                    this.render(response.data.result);
                })
                .catch(() => {})
        },
        render(items) {
            const width = 960;
            const height = 270;
            
            const nodeWidth = 35;
            const nodePadding = 5;
            
            // min at rank 10
            let atRank = {};
            items.links.forEach((link) => {
                if (link.rank in atRank)
                    atRank[link.rank].push(JSON.parse(JSON.stringify(link)));
                else
                    atRank[link.rank] = [ JSON.parse(JSON.stringify(link)) ];
            });
            // sort each atRank by value
            for (let rank in atRank) {
                atRank[rank] = atRank[rank].sort((a, b) => b.value - a.value).slice(0, 10);
            }
            // flatten
            let filterNodes = [];
            let filterLinks = [];
            for (let rank in atRank) {

                filterLinks = filterLinks.concat(atRank[rank]);
            }
            
            filterLinks.forEach((link) => {
                if (!filterNodes.includes(link.source))
                filterNodes.push(link.source);
                if (!filterNodes.includes(link.target))
                filterNodes.push(link.target);
            });
            
            let newNodes = filterNodes.map((node) => {
                return { id: node };
            });
            
            const svg = d3
                .select(this.$refs.svg)
                .attr('viewBox', [0, 0, width, height]);

            svg.selectAll('*').remove();
            
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            
            const s = sankey()
                .nodeId((d) => d.id)
                .nodeSort(undefined)
                .nodeWidth(nodeWidth)
                .nodePadding(nodePadding)
                .nodeAlign(sankeyLeft)
                .extent([[0, 0], [width - 125, height - 10]]);

            const { nodes, links } = s({ nodes: newNodes, links: filterLinks });
            
            svg.append('g')
                    .attr('stroke', '#000')
                    .attr('stroke-width', '0')
                .selectAll('rect')
                .data(nodes)
                .join('rect')
                    .attr('x', (d) => d.x0 + 1)
                    .attr('y', (d) => d.y0)
                    .attr('height', (d) => d.y1 - d.y0)
                    .attr('width', (d) => d.x1 - d.x0 - 2)
                    .attr('fill', (d) => color.range()[d.index % 10])
                .append('title')
                    .text((d) => `${d.id}: ${d.value}`);
                
            const link = svg
                .append('g')
                    .attr('fill', 'none')
                .selectAll('g')
                .data(links)
                .join('g')
                    .attr("stroke", "#88888844")
                    .style("mix-blend-mode", "multiply");
            
            link.append('path')
                .attr('d', sankeyLinkHorizontal())
                .attr('stroke-width', (d) => Math.max(1, d.width));
            
            link.append('title')
                .text((d) => `${d.source.id} → ${d.target.id}: ${d.value}`);
            
            svg.append('g')
                .selectAll('text')
                .data(nodes)
                .join('g')
                    .attr('transform', (d) => `translate(${d.x1 + 3},${d.y0 + ((d.y1 - d.y0) / 2) + 1})`)
                .append('text')
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .text((d) => d.id);
        }
    }
};
</script>

<style>
.theme--dark svg text {
    fill: white;
}
.theme--light svg text {
    fill: black;
}
svg text {
    font-size: min(calc(20px + (8 - 14) * ((100vw - 480px) / (960 - 480))), 20px);
}
</style>