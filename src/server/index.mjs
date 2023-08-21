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

console.log('Loading Databases...')
const checkpoints = [];
const aaDb = new DbReader();
checkpoints.push(aaDb.make(dataPath + '/afdb', dataPath + '/afdb.index'));

const caDb = new DbReader();
checkpoints.push(caDb.make(dataPath + '/afdb_ca', dataPath + '/afdb_ca.index'));

const plddtDB = new DbReader();
checkpoints.push(plddtDB.make(dataPath + '/afdb_plddt', dataPath + '/afdb_plddt.index'));

const descDB = new DbReader();
checkpoints.push(descDB.make(dataPath + '/afdb_desc', dataPath + '/afdb_desc.index'));

const avaDb = new DbReader();
checkpoints.push(avaDb.make(dataPath + '/ava_db', dataPath + '/ava_db.index'));

let warnDB = null;
if (existsSync(dataPath + '/warning_db')) {
    warnDB = new DbReader();
    checkpoints.push(warnDB.make(dataPath + '/warning_db', dataPath + '/warning_db.index'));
}

await Promise.all(checkpoints);
console.timeLog();

function getDescription(accession) {
    let descId = descDB.id(accession);
    if (descId.found == false) {
        return "";
    } else {
        return descDB.data(descId.value).toString('utf8');
    }
}

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

app.post('/api/go/:goid', async (req, res) => {
    const goid = req.params.goid;
    const search_type = req.body.go_search_type;

    let query_where = "";
    let result;

    if (search_type === 'exact') {
        query_where = "go.goid = ?";   
    } else {
        query_where = "go.goid in (SELECT child FROM go_child as gc WHERE gc.parent = ?)";
    }

    result = await sql.all(
        `SELECT *
            FROM cluster as c
            LEFT JOIN cluster_go as go ON go.rep_accession == c.rep_accession
            WHERE ${query_where}
            ORDER BY c.rep_accession
            LIMIT ? OFFSET ?;
        `, goid, req.body.itemsPerPage, (req.body.page-1));
    
    const total = await sql.get(`SELECT COUNT(rep_accession) as total FROM cluster_go as go WHERE ${query_where}`, goid);

    result.forEach(x => { if (x.lca_tax_id) x.lca_tax_id = tree.getNode(x.lca_tax_id); })
    // result.lca_tax_id = tree.getNode(result.lca_tax_id);
    
    res.send({ total: total.total, result : result });
});

app.post('/api/cluster/:cluster/search/taxonomy/:suggest', async (req, res) => {
    const bundle_data = req.body.bundle_data;
    // console.log('bundle', bundle_data);

    let result = bundle_data.map(x => { return {lca_tax_id: x.lca_tax_id.id}});

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

app.post('/api/search/filter', async (req, res) => {
    const is_dark = req.body.is_dark;
    const is_tax_filter = req.body.tax_id != undefined;
    const avg_length_range = req.body.avg_length_range;
    const avg_plddt_range = req.body.avg_plddt_range;
    const n_mem_range = req.body.n_mem_range;
    const rep_length_range = req.body.rep_length_range;
    const rep_plddt_range = req.body.rep_plddt_range;
    const search_type = req.body.search_type;
    const go_search_type = req.body.go_search_type;

    let queries_where = [];
    
    let result;
    if (search_type === 'foldseek') {
        result = req.body.bundle;

        result = result.filter((x) => {
            if (is_dark != undefined) {
                if (x.is_dark !== is_dark) {
                    return false;
                }
            }
            
            if (!(x.avg_len >= avg_length_range[0] && x.avg_len <= avg_length_range[1])) {
                return false;
            }
            if (!(x.avg_plddt >= avg_plddt_range[0] && x.avg_plddt <= avg_plddt_range[1])) {
                return false;
            }
            if (!(x.n_mem >= n_mem_range[0] && x.n_mem <= n_mem_range[1])) {
                return false;
            }
            if (!(x.rep_len >= rep_length_range[0] && x.rep_len <= rep_length_range[1])) {
                return false;
            }
            if (!(x.rep_plddt >= rep_plddt_range[0] && x.rep_plddt <= rep_plddt_range[1])) {
                return false;
            }
    
            if (is_tax_filter) {
                if (tree.nodeExists(x.lca_tax_id.id) == false) {
                    return false;
                }
                x.lca_tax_id.id = tree.getNode(x.lca_tax_id.id);
                let currNode = x.lca_tax_id.id;
                while (currNode.id != 1) {
                    if (currNode.id == req.body.tax_id.value) {
                        return true;
                    }
                    currNode = tree.getNode(currNode.parent);
                }
            } else {
                return true;
            }
    
            return false;
        });
    } else if (search_type === 'go') {
        const goid = req.body.query_GO;
        const filter_params = [avg_length_range[0], avg_length_range[1] ?? 'INF', 
            avg_plddt_range[0], avg_plddt_range[1] ?? 'INF', n_mem_range[0], 
            n_mem_range[1] ?? 'INF', rep_length_range[0], rep_length_range[1] ?? 'INF', 
            rep_plddt_range[0], rep_plddt_range[1] ?? 'INF'];
        
        if (go_search_type === 'exact') {
            queries_where.push("go.goid = ?")
        } else {
            queries_where.push("go.goid in (SELECT child FROM go_child as gc WHERE gc.parent = ?)");
        }
        
        
        queries_where.push(`c.avg_len >= ? AND c.avg_len <= ?`);
        queries_where.push(`c.avg_plddt >= ? AND c.avg_plddt <= ?`);
        queries_where.push(`c.n_mem >= ? AND c.n_mem <= ?`);
        queries_where.push(`c.rep_len >= ? AND c.rep_len <= ?`);
        queries_where.push(`c.rep_plddt >= ? AND c.rep_plddt <= ?`);
        if (is_dark != undefined) {
            queries_where.push(`c.is_dark == ?`);
            filter_params.push(is_dark)
        }

        const query_where = queries_where.slice(1, queries_where.length).join(" AND ");
        result = await sql.all(`
            SELECT DISTINCT * 
                FROM cluster as c 
                WHERE c.rep_accession in (
                    SELECT rep_accession 
                        FROM cluster_go as go 
                        WHERE ${queries_where[0]}
                    ) AND ${query_where}
                `, goid, ...filter_params);
        
        if (is_tax_filter) {
            result.forEach(x => { if (x.lca_tax_id) x.lca_tax_id = tree.getNode(x.lca_tax_id); })
            result = result.filter((x) => {
                if (tree.nodeExists(x.lca_tax_id.id) == false) {
                    return false;
                }
                x.lca_tax_id.id = tree.getNode(x.lca_tax_id.id);
                let currNode = x.lca_tax_id.id;
                while (currNode.id != 1) {
                    if (currNode.id == req.body.tax_id.value) {
                        return true;
                    }
                    currNode = tree.getNode(currNode.parent);
                }
        
                return false;
            });
        }
    }
    
    const total = result.length;
    if (result && result.length > 0) {
        result = result.slice((req.body.page - 1) * req.body.itemsPerPage, req.body.page * req.body.itemsPerPage);
    }
    result.forEach((x) => {
        x.description = getDescription(x.rep_accession);
        if (!is_tax_filter) {
            if (x.lca_tax_id) x.lca_tax_id = tree.getNode(x.lca_tax_id); 
        }
    });

    res.send({ total: total, result : result });
});

app.get('/api/foldseek/:jobid', async (req, res) => {
    if (fileCache.contains(req.params.jobid)) {
        res.send(await formatFoldseekResult(JSON.parse(fileCache.get(req.params.jobid))));
        return;
    }
    let result = await axios.get('https://search.foldseek.com/api/result/' + req.params.jobid + '/0', {
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
    });
    const aln = result.data;
    let results = [];
    for (let i = 0; i < aln.results.length; i++) {
        let result = aln.results[i];
        // console.log(aln.results[i]);
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
    fileCache.add(req.params.jobid, JSON.stringify(results));
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

            if (!(currentNode.id in nodes) && currentNode.id != 1) {
                nodes[currentNode.id] = {
                    id: currentNode.id,
                    name: currentNode.name,
                    rank: idx_to_rank[currentNode.rank],
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

            if (!(parentNode.id in nodes) && parentNode.id != 1) {
                nodes[parentNode.id] = {
                    id: parentNode.id,
                    name: parentNode.name,
                    rank: idx_to_rank[parentNode.rank],
                };
            }

            if (currentNode.id == 1 || parentNode.id == 1) {
                break;
            }

            const linkKey = `${currentNode.id}-${parentNode.id}`;
            if (!(linkKey in links)) {
                links[linkKey] = {
                    source: parentNode.id,
                    target: currentNode.id,
                    value: 1,
                    rank: idx_to_rank[parentNode.rank],
                    name: parentNode.name,
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
    const accessions = ids_evalue.map((x) => x[0]).filter((x) => x != cluster);
    let result = await sql.all(`
    SELECT DISTINCT lca_tax_id as tax_id
        FROM cluster
        WHERE rep_accession IN (${accessions.map(() => "?").join(",")});
    `, accessions);
    res.send({result: makeSankey(result)});
});

app.post('/api/cluster/:cluster', async (req, res) => {
    let result = await sql.get("SELECT * FROM cluster as c LEFT JOIN member as m ON c.rep_accession == m.accession WHERE c.rep_accession = ?", req.params.cluster);
    if (!result) {
        res.status(404).send({ error: "No cluster found" });
        return;
    }
    result.lca_tax_id = tree.getNode(result.lca_tax_id);
    result.lineage = tree.lineage(result.lca_tax_id);
    result.tax_id = tree.getNode(result.tax_id);
    result.rep_lineage = tree.lineage(result.tax_id);
    result.description = getDescription(result.rep_accession);
    if (warnDB) {
        const warnKey = warnDB.id(result.rep_accession);
        result.warning = warnKey.found;
    } else {
        result.warning = false;
    }
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
            ORDER BY rowid;
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
        const total = await sql.get(`SELECT COUNT(accession) as total FROM member WHERE rep_accession = ? ${flagFilter}`, ...args);
        let result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ? ${flagFilter}
            ORDER BY rowid
            LIMIT ? OFFSET ?;
        `, ...args, req.body.itemsPerPage, (req.body.page - 1) * req.body.itemsPerPage);
        result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id); x.description = getDescription(x.accession) });
        res.send({ total: total.total, result : result });
    }
});

app.post('/api/cluster/:cluster/members/taxonomy/:suggest', async (req, res) => {
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
    // console.log(result)
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

app.post('/api/cluster/:cluster/similars/taxonomy/:suggest', async (req, res) => {
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
