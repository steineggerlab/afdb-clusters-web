// Adapted from https://github.com/glaunay/ncbitaxonomy
// Apache 2 licensed:
// https://github.com/glaunay/ncbitaxonomy/blob/525c6fdfb2599a9564aeb1a33a9ce8ae6a5fc224/LICENSE

import { createReadStream, readdir } from 'fs';
import { createInterface } from 'readline';
import { Writable } from 'stream';
import { readFileSync, writeFileSync } from 'fs';

const rank_to_idx = {
    "no rank": 0,
    "forma": 1,
    "varietas": 2,
    "subspecies": 3,
    "species": 4,
    "species subgroup": 5,
    "species group": 6,
    "subgenus": 7,
    "genus": 8,
    "subtribe": 9,
    "tribe": 10,
    "subfamily": 11,
    "family": 12,
    "superfamily": 13,
    "parvorder": 14,
    "infraorder": 15,
    "suborder": 16,
    "order": 17,
    "superorder": 18,
    "infraclass": 19,
    "subclass": 20,
    "class": 21,
    "superclass": 22,
    "subphylum": 23,
    "phylum": 24,
    "superphylum": 25,
    "subkingdom": 26,
    "kingdom": 27,
    "superkingdom": 28,
    // 
    "forma specialis": 29,
    "strain": 30,
    "serotype": 31,
    "serogroup": 32,
    "isolate": 33,
    "clade": 34,
    "section": 35,
    "genotype": 36,
    "morph": 37,
    "biotype": 38,
    "subcohort": 39,
    "pathogroup": 40,
    "subsection": 41,
    "cohort" : 42,
    "series": 43,
}

// renumber ranks to be consecutive


const idx_to_rank = Array.from(Object.keys(rank_to_idx));

function bcpLineSplit(lineContent) {
    return lineContent.slice(0, -2).split('\t|\t');
}

async function parseTree(pathDir) {
    let fI = await openFolderSources(pathDir);
    let myTree = new Tree();
    await myTree.parseNodeList(fI.topology);
    await myTree.parseNames(fI.nodeNames);
    return myTree;
}

async function serializeTree(pathDir, jsonOut) {
    let tree = await parseTree(pathDir);
    const buffer = JSON.stringify(tree.nodePool);
    writeFileSync(jsonOut, buffer);
}

function unserializeTree(jsonIn) {
    const buffer = readFileSync(jsonIn);
    let tree = new Tree();
    tree.nodePool = JSON.parse(buffer);
    return tree;
}

function openFolderSources(pathDir) {
    return new Promise((resolve, reject) => {
        readdir(pathDir, (err, files) => {
            let data = {};
            files.forEach(file => {
                if (file === 'names.dmp')
                    data['nodeNames'] = createReadStream(`${pathDir}/${file}`);
                if (file === 'nodes.dmp')
                    data['topology'] = createReadStream(`${pathDir}/${file}`);
            });
            if (!("nodeNames" in data) || !("topology" in data))
                reject('Mssing');
            resolve(data);
        });
    });
}

class Tree {
    constructor() {
        this.nodePool = {};
    }

    lineage(node) {
        let currNode = node;
        let lineageArray = [];
        while (currNode.id != 1) {
            lineageArray.push(currNode);
            currNode = this.getNode(currNode.parent);
        }
        lineageArray.push(currNode);
        return lineageArray;
    }

    isChildOf(maybeChildNode, maybeParentNode) {
        const lineage = this.lineage(maybeChildNode);
        for (const node of lineage) {
            if (node.id == maybeParentNode)
                return true;
        }
        return false;
    }

    // Clunky implentation
    find(data) {
        let hits = [];
        if (data.name) {
            for (const n of this.nodes()) {
                if (n.name == data.name) {
                    hits.push(n);
                    break;
                }
            }
        }
        if (data.id && data.id in this.nodePool)
            hits.push(this.getNode(data.id));
        if (data.directParent) {
            for (const n of this.nodes()) {
                if (n.parent === data.directParent) {
                    hits.push(n);
                    break;
                }
            }
        }
        return hits;
    }

    *nodes() {
        let c = 0;
        for (const k in this.nodePool) {
            yield this.getNode(k);
            c++;
        }
        return c;
    }

    nodeExists(id) {
        return id in this.nodePool;
    }

    getNode(id, numeric_rank = false) {
        const node = this.nodePool[id];
        return {
            id: node.i,
            name: node.n,
            parent: node.p,
            rank: numeric_rank ? node.r : idx_to_rank[node.r],
        }
    }

    async parseNodeList(fStream) {
        return new Promise((resolve, reject) => {
            let n = 0;
            const rl = createInterface({
                input: fStream,
                output: new Writable()
            });
            rl.on('line', data => {
                const arr = bcpLineSplit(data);
                // if (!(arr[2] in rank_to_idx)) {
                    // console.log(`Rank ${arr[2]} not found`);
                // }
                const id = Number(arr[0]);
                this.nodePool[id] = {
                    i: id,
                    p: Number(arr[1]),
                    r: rank_to_idx[arr[2]]
                };
                n += 1;
            });
            rl.on('close', () => {
                resolve(n);
            });
        });
    }

    async parseNames(fStream) {
        return new Promise((resolve, reject) => {
            const rl = createInterface({
                input: fStream,
                output: new Writable()
            });
            rl.on('line', data => {
                let arr = bcpLineSplit(data);
                if (arr[3] != 'scientific name')
                    return;
                let n = this.nodePool[Number(arr[0])];
                n.n = arr[1];
            });
            rl.on('close', () => {
                resolve(49);
            });
        });
    }
}

export {
    parseTree,
    serializeTree,
    unserializeTree,
    Tree,
    rank_to_idx,
    idx_to_rank,
}