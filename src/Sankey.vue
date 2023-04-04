<template>
    <svg class="hide" ref="svg"></svg>
</template>

<script>
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';

export default {
    name: 'Sankey',
    props: ['cluster', 'type'],
    data: () => ({
        response: null,
    }),
    watch: {
        cluster() {
            this.fetchData();
        },
        response() {
            this.render(this.response);
        }
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        fetchData() {
            this.$axios.get("/cluster/" + this.cluster + "/sankey-" + this.type)
                .then(response => {
                    this.response = response.data.result;
                })
                .catch(() => {})
        },
        render(items) {
            // from spring colors :) (https://wondernote.org/color-palettes-for-web-digital-blog-graphic-design-with-hexadecimal-codes/)
            const colors = ['#afddd5', '#ffa700', '#ffcccd', '#f56093', '#64864a', '#dfe6e6', '#dfdec0', '#ff7e5a', '#ffbd00', '#7db954', '#feddcb', '#ffc700', '#cee8e5', '#c6b598', '#fee100', '#fac4c4', '#e0e7ad', '#fdbb9f', '#eadcc3', '#eef3b4', '#ffb27b', '#ff284b', '#7abaa1', '#cfeae4'];
            const width = 960;
            const height = 270;
            
            const nodeWidth = 35;
            const nodePadding = 5;

            const atRank = {};
            for (const link of items.links) {
                const rank = link.rank;
                const copyLink = JSON.parse(JSON.stringify(link));
                atRank[rank] = atRank[rank] || [];
                atRank[rank].push(copyLink);
            }

            let filterLinks = [];
            let keep = new Set();
            for (const rank of ['superkingdom', 'kingdom']) {
                if (!atRank[rank]) {
                    continue;
                }
                let sorted = atRank[rank].sort((a, b) => b.value - a.value)
                for (let i = 0; i < sorted.length; i++) {
                    keep.add(sorted[i].target);
                    filterLinks.push(sorted[i]);
                }
            }
            for (const rank of ['phylum', 'family', 'genus', 'species']) {
                if (!atRank[rank]) {
                    continue;
                }
                let sorted = atRank[rank].sort((a, b) => b.value - a.value)
                let count = 0;
                const maxPerRank = rank == "phylum" ? 15 : 10;
                while (count < maxPerRank && sorted.length > 0) {
                    let link = sorted.shift();
                    if (!keep.has(link.source)) {
                        continue;
                    }
                    keep.add(link.target);
                    filterLinks.push(link);
                    count++;
                }
            }

            const filterNodes = new Set(filterLinks.flatMap(link => [link.source, link.target]));
            const newNodes = items.nodes.filter(node => filterNodes.has(node.id)).reverse();

            if (newNodes.length == 0) {
                d3.select(this.$refs.svg).classed('hide', true);
                return;
            }
            
            const svg = d3
                .select(this.$refs.svg)
                .attr('viewBox', [0, 0, width, height])
                .classed('hide', false);

            svg.selectAll('*').remove();
            
            const color = d3.scaleOrdinal(d3.schemeCategory10);
            
            const s = sankey()
                .nodeId((d) => d.id)
                .nodeSort(undefined)
                .nodeWidth(nodeWidth)
                .nodePadding(nodePadding)
                .nodeAlign(sankeyLeft)
                .extent([[0, 5], [width - 175, height - 5]]);

            const { nodes, links } = s({ nodes: newNodes, links: filterLinks });
            svg.append('g')
                    .attr('stroke', '#000')
                    .attr('stroke-width', '0')
                .selectAll('rect')
                .data(nodes)
                .join('rect')
                    .attr('class', (d) => 'node taxid-' + d.id)
                    .attr('x', (d) => d.x0 + 1)
                    .attr('y', (d) => d.y0)
                    .attr('height', (d) => d.y1 - d.y0)
                    .attr('width', (d) => d.x1 - d.x0 - 2)
                    .attr('fill', (d) => 
                    {   
                        return (d.sourceLinks.length == 0) ? colors[d.index % colors.length] : "#888";
                    })
                    .on('click', (event, d) => {
                        if (event.target.classList.contains('active')) {
                            d3.selectAll('rect.node, text.label').classed('active', false);
                            this.$emit('select', null);
                        } else {
                            d3.selectAll('rect.node, text.label').classed('active', false);
                            d3.selectAll('.taxid-' + d.id).classed('active', true);
                            this.$emit('select', { name: d.name, id: d.id });
                        }
                    })
                .append('title')
                    .text((d) => `${d.name}: ${d.value}`);
                
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
                .text((d) => `${d.source.name} → ${d.target.name}: ${d.value}`);
            
            svg.append('g')
                .selectAll('text')
                .data(nodes)
                .join('g')
                    .attr('transform', (d) => `translate(${d.x1 + 3},${d.y0 + ((d.y1 - d.y0) / 2) + 1})`)
                .append('text')
                    .attr('class', (d) => 'label taxid-' + d.id)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .text((d) => d.name)
                    .on('click', (event, d) => {
                        if (event.target.classList.contains('active')) {
                            d3.selectAll('rect.node, text.label').classed('active', false);
                            this.$emit('select', null);
                        } else {
                            d3.selectAll('rect.node, text.label').classed('active', false);
                            d3.selectAll('.taxid-' + d.id).classed('active', true);
                            this.$emit('select', { name: d.name, id: d.id });
                        }
                    })
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

svg.hide {
    display: none;
}

svg text {
    cursor: pointer;
    font-size: calc(30px + (8 - 16) * ((100vw - 320px) / (640 - 320)));
}

svg text.label.active {
    font-weight: bold;
}

svg rect.node {
    cursor: pointer;
}

svg rect.node.active {
    stroke-width: 2px;
    stroke: #333;
}

@media (min-width: 641px) {
    svg text {
        font-size: calc(16px + (4 - 8) * ((100vw - 640px) / (1280 - 640)));
    }
}

@media (min-width: 1280px) {
    svg {
        width: 1280px;
    }
    
    svg text {
        font-size: 10px;
    }
}
</style>
