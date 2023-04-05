<template>
    <svg class="hide" ref="svg"></svg>
</template>

<script>
import { select, selectAll } from 'd3';
import { sankey } from './lib/sankeyD3/sankey.js';

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
            const nodePadding = 9;

            const tax_to_layer = {};
            for (const node of items.nodes) {
                node.posX = ['superkingdom', 'kingdom', 'phylum', 'family', 'genus', 'species'].indexOf(node.rank);
                node.posX = node.posX * 100;
                tax_to_layer[node.id] = node.posX;
            }

            items.links = items.links.sort((a, b) => {
                const aLayer = tax_to_layer[a.target];
                const bLayer = tax_to_layer[b.target];
                if (aLayer != bLayer) {
                    return aLayer - bLayer;
                }
                return b.value - a.value;
            });

            let groupedLinks = {};
            let eliminatedNodes = new Set();
            let nodeIdx = {};
            for (const link of items.links) {
                const key = `${tax_to_layer[link.target]}`;
                if (groupedLinks[key]) {
                    if (groupedLinks[key].length < 10 && !eliminatedNodes.has(link.target)) {
                        nodeIdx[link.source] = groupedLinks[key].length;
                        nodeIdx[link.target] = groupedLinks[key].length;
                        groupedLinks[key].push(link);
                    } else {
                        eliminatedNodes.add(link.source);
                    }
                } else { 
                    if (!eliminatedNodes.has(link.target)) {
                        nodeIdx[link.source] = 0;
                        nodeIdx[link.target] = 0;
                        groupedLinks[key] = [ link ];
                    }
                }
            }

            const newLinks = [].concat(...Object.values(groupedLinks));
            const filterNodes = new Set(newLinks.flatMap(link => [link.source, link.target]));
            const newNodes = items.nodes.filter(node => filterNodes.has(node.id)).reverse();

            if (newNodes.length == 0) {
                select(this.$refs.svg).classed('hide', true);
                return;
            }
            
            const svg = select(this.$refs.svg)
                .attr('viewBox', [0, 0, width, height])
                .classed('hide', false);

            svg.selectAll('*').remove();
            
            const s = sankey();
            s
                .nodes(newNodes)
                .links(newLinks)
                .size([width - 170, height - 10])
                .align('none')
                .nodeWidth(nodeWidth)
                .nodePadding(nodePadding)
                .yOrderComparator((a, b) => {
                    return b.value - a.value;
                })
            s.layout(10);

            const container = svg.append('g')
                .attr('transform', 'translate(0,5)')

            container.append('g')
                    .attr('stroke', '#000')
                    .attr('stroke-width', '0')
                .selectAll('rect')
                .data(s.nodes())
                .join('rect')
                    .attr('class', (d) => 'node taxid-' + d.id)
                    .attr('x', (d) => d.x + 1)
                    .attr('y', (d) => d.y)
                    .attr('height', (d) => d.dy)
                    .attr('width', (d) => d.dx - 2)
                    .attr('fill', (d) => 
                    {   
                        return (d.sourceLinks.length == 0) ? colors[nodeIdx[d.id] % colors.length] : "#888";
                    })
                    .on('click', (event, d) => {
                        if (event.target.classList.contains('active')) {
                            selectAll('rect.node, text.label').classed('active', false);
                            this.$emit('select', null);
                        } else {
                            selectAll('rect.node, text.label').classed('active', false);
                            selectAll('.taxid-' + d.id).classed('active', true);
                            this.$emit('select', { name: d.name, id: d.id });
                        }
                    })
                .append('title')
                    .text((d) => `${d.name}: ${d.value}`);
                
            const link = container
                .append('g')
                    .attr('fill', 'none')
                .selectAll('g')
                .data(s.links())
                .join('g')
                    .attr("stroke", "#88888844")
                    .style("mix-blend-mode", "multiply");
            
            link.append('path')
                .attr('d', s.link())
                .attr('stroke-width', (d) => Math.max(1, d.dy));
            
            link.append('title')
                .text((d) => `${d.source.name} → ${d.target.name}: ${d.value}`);
            
            container.append('g')
                .selectAll('text')
                .data(s.nodes())
                .join('g')
                    .attr('transform', (d) => `translate(${(d.x + d.dx) + 3},${d.y + ((d.dy) / 2) + 1})`)
                .append('text')
                    .attr('class', (d) => 'label taxid-' + d.id)
                    .attr('text-anchor', 'start')
                    .attr('dominant-baseline', 'middle')
                    .text((d) => d.name)
                    .on('click', (event, d) => {
                        if (event.target.classList.contains('active')) {
                            selectAll('rect.node, text.label').classed('active', false);
                            this.$emit('select', null);
                        } else {
                            selectAll('rect.node, text.label').classed('active', false);
                            selectAll('.taxid-' + d.id).classed('active', true);
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
