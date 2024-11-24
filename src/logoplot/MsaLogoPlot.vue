<template>
    <div>
        <span v-show="loading">Loading...</span>
        <div ref="target"></div>
    </div>
</template>

<script>
import { logoplot } from './d3.logoplot.js';
import './d3.logoplot.css';

export default {
    name: "msalogoplot",
    props: {
        accession: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            loading: false,
        };
    },
    methods: {
        async fetchAndRenderMSA(accession) {
            const $el = this.$refs.target;
            this.loading = true;
            $el.innerHTML = "";
            
            try {
                accession = accession.toUpperCase().replace(/[^A-Z0-9]/g, "");
                
                const response = await fetch(`https://bfvd.steineggerlab.workers.dev/a3m/${accession}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch A3M file: ${response.statusText}`);
                }
                
                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");
                const sequences = [];
                let buffer = "";
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    // Decode the current chunk and add it to the buffer
                    buffer += decoder.decode(value, { stream: true });
                    
                    // Split the buffer into lines
                    const lines = buffer.split("\n");
                    
                    // Keep the last line in the buffer in case it is incomplete
                    buffer = lines.pop();
                    
                    // Process each line
                    for (const line of lines) {
                        if (!line.startsWith(">")) {
                            // Remove all lower-case letters
                            const sequence = line.replace(/[a-z]/g, "");
                            sequences.push(sequence);
                        }
                    }
                }
                
                // Process any remaining content in the buffer
                if (buffer) {
                    const lines = buffer.split("\n");
                    for (const line of lines) {
                        if (!line.startsWith(">")) {
                            const sequence = line.replace(/[a-z]/g, "");
                            sequences.push(sequence);
                        }
                    }
                }
                
                logoplot.buildChunked(sequences, $el, {
                    width: 960,
                    height: 120,
                    chunkSize: 80,
                });
            } catch (e) {
                console.error(e);
                $el.innerHTML = "Something went wrong. Please try again later.";
            } finally {
                this.loading = false;
            }
        },
    },
    mounted() {
        if (this.accession) {
            this.fetchAndRenderMSA(this.accession);
        }
    }
    // watch: {
    //     accession: {
    //         immediate: true,
    //         handler(newVal, oldVal) {
    //             if (newVal == oldVal) {
    //                 return;
    //             }
    //             if (newVal) {
    //                 this.fetchAndRenderMSA(newVal);
    //             } else {
    //                 console.error("No input sequence provided.");
    //                 this.$refs.target.querySelector("#target").innerHTML = "No input sequence provided.";
    //             }
    //         },
    //     },
    // },
};
</script>



