<template>
    <svg class="hide" ref="svg"></svg>
</template>

<script>
import * as d3sankey from "d3-sankey";
import { select, selectAll, scaleOrdinal, color } from 'd3';
import { sankey } from './lib/sankeyD3/sankey.js';

export default {
    name: 'Sankey',
    props: ['cluster', 'type'],
    data: () => ({
        response: null,
        sankeyRankOrder: ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species", "no rank"],
        fullRankOrder: [
			"superkingdom",
			"kingdom",
			"subkingdom",
			"superphylum",
			"phylum",
			"subphylum",
			"superclass",
			"class",
			"subclass",
			"superorder",
			"order",
			"suborder",
			"infraorder",
			"parvorder",
			"superfamily",
			"family",
			"subfamily",
			"supergenus",
			"genus",
			"subgenus",
			"superspecies",
			"species",
			"subspecies",
			"no rank",
			"clade",
		],
        colors: [
			"#57291F",
			"#C0413B",
			"#D77B5F",
			"#FF9200",
			"#FFCD73",
			"#F7E5BF",
			"#C87505",
			"#F18E3F",
			"#E59579",
			"#C14C32",
			"#80003A",
			"#506432",
			"#FFC500",
			"#B30019",
			"#EC410B",
			"#E63400",
			"#8CB5B5",
			"#6C3400",
			"#FFA400",
			"#41222A",
			"#FFB27B",
			"#FFCD87",
			"#BC7576",
		],
	}
	),
    watch: {
        cluster() {
            this.fetchData();
        },
        response() {
            this.newRender(this.response);
        }
    },
    mounted() {
        this.fetchData();
    },
    methods: {
        // Helper functions for drawing Sankey
		nodeHeight(d) {
			let nodeHeight = d.y1 - d.y0;
			if (nodeHeight < 1) {
				return 1.5;
			} else {
				return d.y1 - d.y0;
			}
		},
        formatCladeReads(value) {
			if (value >= 1000) {
				return `${(value / 1000).toFixed(2)}k`;
			}
				return value.toString();
		},
		formatProportion(value) {
			return `${value.toFixed(3)}%`;
		},
        fetchData() {
            this.$axios.get("/cluster/" + this.cluster + "/sankey-" + this.type)
                .then(response => {
                    this.response = response.data.result;
                })
                .catch(() => {})
        },
        // Main function for rendering Sankey
		newRender(items) {
			const { nodes, links } = items;

			// Check if nodes and links are not empty
			if (!nodes.length || !links.length) {
				select(this.$refs.svg).classed('hide', true);
				return;
			}

			const container = this.$refs.svg;
			select(container).selectAll("*").remove(); // Clear the previous diagram

			const width = 960;
			const height = 670;
			const nodeWidth = 20;
      		const nodePadding = 13;
			const marginBottom = 50; // Margin for rank labels
			const marginRight = 150;

			const svg = 
				select(container)
				.attr('viewBox', [0, 0, width, height + marginBottom])
				.classed('hide', false);

			const sankeyGenerator = d3sankey.sankey()
				.nodeId((d) => d.id)
				.nodeAlign(d3sankey.sankeyJustify)
				.nodeWidth(nodeWidth)
				.nodePadding(nodePadding)
				.iterations(100)
				.extent([
					[10, 10],
					[width - marginRight, height - 6],
				]);
                const graph = sankeyGenerator({
                    nodes: nodes.map((d) => Object.assign({}, d)),
                    links: links.map((d) => Object.assign({}, d)),
                });
                
                const color = scaleOrdinal().range(this.colors);
                const unclassifiedLabelColor = "#696B7E";
                
                // Manually adjust nodes position to align by rank
                const columnWidth = (width - marginRight) / this.sankeyRankOrder.length;
                const columnMap = this.sankeyRankOrder.reduce((acc, rank, index) => {
                    const leftMargin = 10;
                    acc[rank] = index * columnWidth + leftMargin;
                    return acc;
                }, {});
                
                graph.nodes.forEach((node) => {
                    node.x0 = columnMap[node.rank];
                    node.x1 = node.x0 + sankeyGenerator.nodeWidth();
                    
                    if (node.type === "unclassified") {
                        node.color = unclassifiedLabelColor;
                    } else {
                        node.color = color(node.id); // Assign color to node
                    }
                });
                
			// Re-run the layout to ensure correct vertical positioning
			sankeyGenerator.update(graph);

			// Add rank column labels
			const rankLabels = ["D", "K", "P", "C", "O", "F", "G", "S"];
			svg
				.append("g")
				.selectAll("text")
				// .data(rankLabels)
				.data(this.sankeyRankOrder)
				.enter()
				.append("text")
				.attr("x", (rank) => columnMap[rank] + sankeyGenerator.nodeWidth() / 2)
				.attr("y", height + marginBottom / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.text((rank, index) => rankLabels[index]);

			// Draw rank label divider link
			svg
				.append("line")
				.attr("x1", 0)
				.attr("y1", height + 10)
				.attr("x2", width)
				.attr("y2", height + 10)
				.attr("stroke", "#000")
				.attr("stroke-width", 1);

			// Function to highlight lineage
			const highlightLineage = (node) => {
				const lineageIds = new Set(node.lineage.map((n) => n.id));
				lineageIds.add(node.id);

				svg.selectAll("rect").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.2));
				svg.selectAll("path").style("opacity", (d) => (lineageIds.has(d.source.id) && lineageIds.has(d.target.id) ? 1 : 0.2));
				svg.selectAll(".label").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
				svg.selectAll(".clade-reads").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
			};

			// Function to reset highlight
			const resetHighlight = () => {
				svg.selectAll("rect").style("opacity", 1);
				svg.selectAll("path").style("opacity", 1);
				svg.selectAll(".label").style("opacity", 1);
				svg.selectAll(".clade-reads").style("opacity", 1);
			};

			// Define a clipping path for each link (crops out curve when links are too thick)
			svg
				.append("defs")
				.selectAll("clipPath")
				.data(graph.links)
				.enter()
				.append("clipPath")
				// .attr("id", (d, i) => `clip-path-${this.instanceId}-${i}`)
				.append("rect")
				.attr("x", (d) => d.source.x1)
				.attr("y", 0)
				.attr("width", (d) => d.target.x0 - d.source.x1)
				.attr("height", height);

			// Add links
			svg
				.append("g")
				.attr("fill", "none")
				.attr("stroke-opacity", 0.3)
				.selectAll("path")
				.data(graph.links)
				.enter()
				.append("path")
				.attr("d", d3sankey.sankeyLinkHorizontal())
				.attr("stroke", (d) => (d.target.type === "unclassified" ? unclassifiedLabelColor : color(d.source.color))) // Set link color to source node color with reduced opacity
				.attr("stroke-width", (d) => Math.max(1, d.width))
				// .attr("clip-path", (d, i) => `url(#clip-path-${this.instanceId}-${i})`);

			// Create node group (node + labels) and add mouse events
			const nodeGroup = svg
				.append("g")
				.selectAll(".node-group")
				.data(graph.nodes)
				.enter()
				.append("g")
				.attr("class", (d) => "node-group taxid-" + d.id)
				.attr("transform", (d) => `translate(${d.x0}, ${d.y0})`)
				.on("mouseover", (event, d) => {
					// Create the tooltip div
					const tooltip = select('body').append('div')
						.attr('class', 'tooltip')
						.html(`
							<div style="padding-top: 4px; padding-bottom: 4px; padding-left: 8px; padding-right: 8px;">
								<p style="font-size: 0.6rem; margin-bottom: 0px;">#${d.id}</p>
								<div style="display: flex; justify-content: space-between; align-items: center;">
									<div style="font-weight: bold; font-size: 0.875rem;">${d.name}</div>
									<span style="background-color: rgba(255, 167, 38, 0.25); color: #ffa726; font-weight: bold; padding: 4px 8px; border-radius: 12px; font-size: 0.875rem; margin-left: 10px;">${d.rank}</span>
								</div>
								<hr style="margin: 8px 0; border: none; border-top: 1px solid #fff; opacity: 0.2;">
								<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;">
									<div style="font-weight: bold;">Clade Reads</div>
									<div style="margin-left: 10px;">${d.value}</div>
								</div>
							</div>
						`)
						.style('left', `${d.x + d.dx}px`)
						.style('top', `${d.y + window.scrollY}px`);
				})
				.on("mousemove", (event, d) => {
					// Move the tooltip as the mouse moves
					select('.tooltip')
						.style('left', `${event.pageX + 10}px`)
						.style('top', `${event.pageY + 10}px`);
				})
				.on("mouseout", () => {
					// Remove the tooltip when mouse leaves
					select('.tooltip').remove();
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

			// Create node rectangles
			nodeGroup
				.append("rect")
				.attr("width", (d) => d.x1 - d.x0)
				.attr("height", (d) => this.nodeHeight(d))
				.attr("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : d.color))
				.attr("class", (d) => "node taxid-" + d.id) // Apply the CSS class for cursor
				.style("cursor", "pointer");

			// Add node name labels next to node
			nodeGroup
				.append("text")
				.attr("id", (d) => `nodeName-${d.id}`)
				.attr("class", (d) => "label taxid-" + d.id)
				.attr("x", (d) => d.x1 - d.x0 + 3)
				.attr("y", (d) => this.nodeHeight(d) / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "start")
				.text((d) => d.name)
				.style("font-size", "10px")
				.style("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : "black"))
				.style("cursor", "pointer");

			// Add label above node (proportion/clade reads)
			nodeGroup
				.append("text")
				.attr("id", (d) => `cladeReads-${d.id}`)
				.attr("class", "clade-reads")
				.attr("x", (d) => (d.x1 - d.x0) / 2)
				.attr("y", -5)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.style("font-size", "10px")
				.style("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : "black"))
				.text((d) => this.formatCladeReads(d.value))
				.style("cursor", "pointer");

			// Highlight nodes matching search query
			// this.highlightNodes(this.searchQuery);
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
                    .on("mouseover", (event, d) => {
                        // Create the tooltip div
                        const tooltip = select('body').append('div')
                            .attr('class', 'tooltip')
                            .html(`
                                <div style="padding-top: 4px; padding-bottom: 4px; padding-left: 8px; padding-right: 8px;">
                                    <p style="font-size: 0.6rem; margin-bottom: 0px;">#${d.id}</p>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div style="font-weight: bold; font-size: 0.875rem;">${d.name}</div>
                                        <span style="background-color: rgba(255, 167, 38, 0.25); color: #ffa726; font-weight: bold; padding: 4px 8px; border-radius: 12px; font-size: 0.875rem; margin-left: 10px;">${d.rank}</span>
                                    </div>
                                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #fff; opacity: 0.2;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem;">
                                        <div style="font-weight: bold;">Clade Reads</div>
                                        <div style="margin-left: 10px;">${d.value}</div>
                                    </div>
                                </div>
                            `)
                            .style('left', `${d.x + d.dx}px`)
                            .style('top', `${d.y + window.scrollY}px`);
                    })
                    .on("mousemove", (event, d) => {
                        // Move the tooltip as the mouse moves
                        select('.tooltip')
                            .style('left', `${event.pageX + 10}px`)
                            .style('top', `${event.pageY + 10}px`);
                    })
                    .on("mouseout", () => {
                        // Remove the tooltip when mouse leaves
                        select('.tooltip').remove();
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

/* Node Hover Tooltip */
.tooltip {
    position: absolute;
    background-color: rgba(38, 50, 56, 0.95);
    padding: 10px;
    border-radius: 8px;
    color: white;
    pointer-events: none;
    z-index: 10;
}
</style>
