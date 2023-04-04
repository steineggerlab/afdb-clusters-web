import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { existsSync } from 'fs';

import DbReader from './dbreader.mjs';
import read from './compressed_ca.mjs';
import { serializeTree, unserializeTree, idx_to_rank } from './ncbitaxonomy.mjs';
import FileCache from './filecache.mjs';
import { convertToQueryUrl } from './utils.mjs';

const dataPath =  process.env.DATA_PATH || './data';
const cachePath = process.env.CACHE_PATH || './data/cache';
const port = process.env.EXPRESS_PORT || 3000;

console.time();
console.log('Loading taxonomy...')
if (!existsSync(dataPath + '/ncbitaxonomy.json')) {
    await serializeTree(dataPath, dataPath + '/ncbitaxonomy.json');
}
const tree = unserializeTree(dataPath + '/ncbitaxonomy.json');
console.timeLog();

console.log('Loading SQL...')
const sql = await open({
    filename: dataPath + '/afdb-clusters.sqlite3',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
})
console.timeLog();

console.log('Loading AA database...')
const aaDb = new DbReader();
await aaDb.make(dataPath + '/afdb', dataPath + '/afdb.index');
console.timeLog();

console.log('Loading C-alpha database...')
const caDb = new DbReader();
await caDb.make(dataPath + '/afdb_ca', dataPath + '/afdb_ca.index');
console.timeLog();

console.log('Loading pLDDT database...')
const plddtDB = new DbReader();
await plddtDB.make(dataPath + '/afdb_plddt', dataPath + '/afdb_plddt.index');
console.timeLog();

console.log('Loading descriptions database...')
const descDB = new DbReader();
await descDB.make(dataPath + '/afdb_desc', dataPath + '/afdb_desc.index');
console.timeLog();

function getDescription(accession) {
    let descId = descDB.id(accession);
    if (descId.found == false) {
        return "";
    } else {
        return descDB.data(descId.value).toString('utf8');
    }
}

console.log('Loading All-vs-all database...')
const avaDb = new DbReader();
await avaDb.make(dataPath + '/ava_db', dataPath + '/ava_db.index');
console.timeLog();

const app = express();
app.use(cors());
app.use(express.text({
    limit: '50mb',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const fileCache = new FileCache(cachePath);

async function formatFoldseekResult(result) {
    const accessions = result.map(r => r.accession);
    const rows = await sql.all(
        `SELECT *
            FROM cluster
            WHERE rep_accession IN (
                SELECT DISTINCT rep_accession
                FROM member
                WHERE accession IN (${accessions.map(() => '?').join(',')})
            )
            `
        , accessions);
    return rows;
}
app.post('/api/foldseek', async (req, res) => {
    const pdb = req.body;
    if (fileCache.contains(pdb)) {
        const result = JSON.parse(fileCache.get(pdb));
        res.send(await formatFoldseekResult(result));
        return;
    }

    let result = await axios.post('https://search.foldseek.com/api/ticket', convertToQueryUrl({
        q: pdb,
        database: ["afdb50", "afdb-swissprot", "afdb-proteome"],
        mode: "3diaa"
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    let job = result.data;
    while (job.status == 'PENDING' || job.status == 'RUNNING') {
        await new Promise(r => setTimeout(r, 1000));
        result = await axios.get('https://search.foldseek.com/api/ticket/' + job.id);
        job = result.data;
    }
    if (job.status != 'COMPLETE') {
        throw new Error('Foldseek failed');
    }

    result = await axios.get('https://search.foldseek.com/api/result/' + job.id + '/0');
    const aln = result.data;
    let results = [];
    for (let i = 0; i < aln.results.length; i++) {
        let result = aln.results[i];
        if (!result.alignments) {
            continue;
        }
        for (let j = 0; j < result.alignments.length; j++) {
            const target = result.alignments[j].target;
            const accession = target.match(/AF-(.*)-F\d-model/)[1];
            if (result.alignments[j].prob < 0.95) {
                continue;
            }
            results.push({
                accession: accession,
                eval: result.alignments[j].eval,
                score: result.alignments[j].score,
                seqId: result.alignments[j].seqId,
                prob: result.alignments[j].prob,
            });
        }
    }

    fileCache.add(pdb, JSON.stringify(results));
    res.send(await formatFoldseekResult(results))
});

app.post('/api/:query', async (req, res) => {
    // axios.get("https://rest.uniprot.org/uniprotkb/search?query=" + req.params.query, {
    //         headers: { 'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/111.0" }
    //     })
    //     .then(response => {
    //         res.send(response.data.results);
    //     })
    //     .catch(error => {
    //         console.log(error);
    //     });
    let result = await sql.get("SELECT * FROM member as m LEFT JOIN cluster as c ON m.rep_accession == c.rep_accession WHERE m.accession = ?", req.params.query);
    if (!result || result.lca_tax_id == null) {
        res.status(404).send({ error: "No cluster found" });
        return;
    }
    result.lca_tax_id = tree.getNode(result.lca_tax_id);
    res.send([ result ]);
});

app.get('/api/cluster/:cluster/annotations', async (req, res) => {
    const cluster = req.params.cluster;
    // let result = await sql.all(`
    // SELECT tax_id
    //     FROM member
    //     WHERE rep_accession == ?;
    // `, cluster);

    function color_designation(high_color, low_color, annotations) {
        let highest_hit = 0;
        let hit_portion = 0;
        let rgb = {};

        for (const ele of annotations) {
            if (highest_hit < ele.hit) {
                highest_hit = ele.hit;
            }
        }

        for (const ele of annotations) {
            hit_portion = ele.hit / highest_hit;

            rgb = {
                r: (high_color.r - low_color.r) * hit_portion + low_color.r,
                g: (high_color.g - low_color.g) * hit_portion + low_color.g,
                b: (high_color.b - low_color.b) * hit_portion + low_color.b,
            }

            ele['color'] = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
        }
    }
    
    let pfams = [
        {id:0, pfam: 'PF00931', hit: 34},
        {id:1, pfam: 'PF01582', hit: 6}
    ]

    color_designation(
        {r: 25, g: 118, b: 210},
        {r: 25, g: 25, b: 25},
        pfams
    )
    
    let result = {
        pfams: pfams
    };

    res.send({result: result});
});


function makeSankey(result) {
    let nodes = {};
    let links = {};
    const allowedRanks = [28, 27, 24, 12, 8, 4];
    result.forEach((x) => {
        if (tree.nodeExists(x.tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.tax_id, true);
        while (node.id != 1) {
            let currentNode = node;
            // skip all ranks except superkingdom, phylum, class, order, family, genus
            while (!allowedRanks.includes(currentNode.rank)) {
                node = tree.getNode(node.parent, true);
                currentNode = node;
                if (currentNode.id == 1) {
                    break;
                }
            }

            if (!(currentNode.id in nodes)) {
                nodes[currentNode.id] = {
                    id: currentNode.id,
                    name: currentNode.name,
                };
            }

            node = tree.getNode(node.parent, true);
            let parentNode = node;
            while (!allowedRanks.includes(parentNode.rank)) {
                node = tree.getNode(node.parent, true);
                parentNode = node;
                if (parentNode.id == 1) {
                    break;
                }
            }

            if (parentNode.name == 'root') {
                continue;
            }

            const linkKey = `${currentNode.id}-${parentNode.id}`;
            if (!(linkKey in links)) {
                links[linkKey] = {
                    source: parentNode.id,
                    target: currentNode.id,
                    value: 1,
                    rank: idx_to_rank[currentNode.rank],
                    name: currentNode.name,
                }
            } else {
                links[linkKey].value += 1;
            }
        }
    });
    // nodes['root'] = { id : 'root' };
    return { nodes : Object.values(nodes), links : Object.values(links) };
}

app.get('/api/cluster/:cluster/sankey-members', async (req, res) => {
    const cluster = req.params.cluster;
    let result = await sql.all(`
    SELECT tax_id
        FROM member
        WHERE rep_accession == ?;
    `, cluster);
    res.send({result: makeSankey(result)});
});

app.get('/api/cluster/:cluster/sankey-similars', async (req, res) => {
    const cluster = req.params.cluster;
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    let map = new Map(ids_evalue);
    const accessions = ids_evalue.map((x) => x[0]);
    let result = await sql.all(`
    SELECT lca_tax_id as tax_id
        FROM cluster
        WHERE rep_accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    res.send({result: makeSankey(result)});
});

app.post('/api/cluster/:cluster', async (req, res) => {
    let result = await sql.get("SELECT * FROM cluster as c LEFT JOIN member as m ON c.rep_accession == m.accession WHERE c.rep_accession = ?", req.params.cluster);
    result.lca_tax_id = tree.getNode(result.lca_tax_id);
    result.lineage = tree.lineage(result.lca_tax_id);
    result.tax_id = tree.getNode(result.tax_id);
    result.rep_lineage = tree.lineage(result.tax_id);
    result.description = getDescription(result.rep_accession);
    res.send(result);
});

app.post('/api/cluster/:cluster/members', async (req, res) => {
    let flagFilter = '';
    let args = [ req.params.cluster ];
    if (req.body.flagFilter != null) {
        flagFilter = 'AND flag = ?';
        args.push(req.body.flagFilter + 1);
    }

    if (req.body.tax_id) {
        let result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ? ${flagFilter}
            ORDER BY id;
        `, ...args);
        result = result.filter((x) => {
            if (tree.nodeExists(x.tax_id) == false) {
                return false;
            }
            x.tax_id = tree.getNode(x.tax_id);
            let currNode = x.tax_id;
            while (currNode.id != 1) {
                if (currNode.id == req.body.tax_id.value) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
        const total = result.length;
        if (result && result.length > 0) {
            result = result.slice((req.body.page - 1) * req.body.itemsPerPage, req.body.page * req.body.itemsPerPage);
        }
        result.forEach((x) => { x.description = getDescription(x.accession) });
        res.send({ total: total, result : result });
    } else {
        const total = await sql.get(`SELECT COUNT(id) as total FROM member WHERE rep_accession = ? ${flagFilter}`, ...args);
        let result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ? ${flagFilter}
            ORDER BY id
            LIMIT ? OFFSET ?;
        `, ...args, req.body.itemsPerPage, (req.body.page - 1) * req.body.itemsPerPage);
        result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id); x.description = getDescription(x.accession) });
        res.send({ total: total.total, result : result });
    }
});

app.get('/api/cluster/:cluster/members/taxonomy/:suggest', async (req, res) => {
    let result = await sql.all(`
        SELECT tax_id
            FROM member
            WHERE rep_accession = ?;
        `, req.params.cluster);
    let suggestions = {};
    let count = 0;
    result.forEach((x) => {
        if (tree.nodeExists(x.tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.tax_id);
        while (node.id != 1) {
            if (node.id in suggestions || count >= 10) {
                break;
            }
            if (node.name.toLowerCase().includes(req.params.suggest.toLowerCase())) {
                suggestions[node.id] = node;
                count++;
            }
            node = tree.getNode(node.parent);
        }
    });
    res.send(Object.values(suggestions));
});

app.post('/api/cluster/:cluster/similars', async (req, res) => {
    const cluster = req.params.cluster;
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    let map = new Map(ids_evalue);
    const accessions = ids_evalue.map((x) => x[0]);
    let result = await sql.all(`
    SELECT *
        FROM cluster
        WHERE rep_accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    result.forEach((x) => {
        x.evalue = map.get(x.rep_accession);
        if (tree.nodeExists(x.lca_tax_id)) {
            x.lca_tax_id = tree.getNode(x.lca_tax_id);
        } else {
            x.lca_tax_id = null;
        }
    });
    if (req.body && req.body.tax_id) {
        result = result.filter((x) => {
            let currNode = x.lca_tax_id;
            if (currNode == null) {
                return false;
            }
            while (currNode.id != 1) {
                if (currNode.id == req.body.tax_id.value) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
    }

    if (req.body.sortBy.length == 0) {
        req.body.sortBy = ['evalue'];
        req.body.sortDesc = [false];
    }

    const identity = (x) => x;
    let castFun = identity;
    if (req.body.sortBy[0] == 'evalue') {
        castFun = parseFloat;
    }
    let sorted = result.sort((a, b) => {
        const sortA = castFun(a[req.body.sortBy[0]]);
        const sortB = castFun(b[req.body.sortBy[0]]);
        
        if (req.body.sortDesc[0]) {
            if (sortA < sortB) return 1;
            if (sortA > sortB) return -1;
            return 0;
        } else {
            if (sortA < sortB) return -1;
            if (sortA > sortB) return 1;
            return 0;
        }
    })
    sorted = sorted.filter((x) => x.rep_accession != cluster);
    const total = sorted.length;
    sorted = sorted.slice((req.body.page - 1) * req.body.itemsPerPage, req.body.page * req.body.itemsPerPage);
    sorted.forEach((x) => { x.description = getDescription(x.rep_accession) });
    res.send({ total: total, similars: sorted });
});

app.get('/api/cluster/:cluster/similars/taxonomy/:suggest', async (req, res) => {
    const cluster = req.params.cluster;
    const avaKey = avaDb.id(cluster);
    if (avaKey.found == false) {
        res.send([]);
        return;
    }
    const ava = avaDb.data(avaKey.value).toString('ascii');
    let ids_evalue = ava.split('\n').map((x) => x.split(' '));
    ids_evalue.splice(-1);
    const accessions = ids_evalue.map((x) => x[0]);
    let result = await sql.all(`
    SELECT *
        FROM cluster
        WHERE rep_accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    let suggestions = {};
    let count = 0;
    result.forEach((x) => {
        if (tree.nodeExists(x.lca_tax_id) == false) {
            return;
        }
        let node = tree.getNode(x.lca_tax_id);
        while (node.id != 1) {
            if (node.id in suggestions || count >= 10) {
                break;
            }
            if (node.name.toLowerCase().includes(req.params.suggest.toLowerCase())) {
                suggestions[node.id] = node;
                count++;
            }
            node = tree.getNode(node.parent);
        }
    });
    res.send(Object.values(suggestions));
});

app.get('/api/structure/:structure', async (req, res) => {
    const structure = req.params.structure;
    const aaKey = aaDb.id(structure);
    if (aaKey.found == false) {
        throw Error(f`${structure} not found in aa db`);
    }
    const aaLength = aaDb.length(aaKey.value) - 2;

    const key = caDb.id(structure);
    if (key.found == false) {
        throw Error(f`${structure} not found in ca db`);
    }

    const plddtKey = plddtDB.id(structure);
    if (plddtKey.found == false) {
        throw Error(f`${structure} not found in plddt db`);
    }
    const plddt = plddtDB.data(plddtKey.value).toString('ascii');

    const size = caDb.length(key.value);
    const aa = aaDb.data(aaKey.value).toString('ascii');
    const ca = caDb.data(key.value);
    const result = Array.from(read(ca, aaLength, size)).map((x) => x.toFixed(3));
    res.send({ seq: aa, coordinates: result, plddt: plddt });
});

app.use((err, req, res, next) => {
    console.log(err);
    res.status(500);
    res.send({ error: err.response && err.response.data ? err.response.data : err.message });
});

app.listen(port, () => {
    console.log(`AFDB-clusters server listening on port ${port}`)
});
