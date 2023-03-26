import express from 'express';
import cors from 'cors';
import axios from 'axios';

import DbReader from './dbreader.mjs';
import read from './compressed_ca.mjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { serializeTree, unserializeTree } from './ncbitaxonomy.mjs';
import { existsSync } from 'fs';


const dataPath = './data';

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

console.log('Loading All-vs-all database...')
const avaDb = new DbReader();
await avaDb.make(dataPath + '/ava_db', dataPath + '/ava_db.index');
console.timeLog();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    result.lca_tax_id = tree.getNode(result.lca_tax_id);
    res.send([ result ]);
});

app.post('/api/cluster/:cluster', async (req, res) => {
    let result = await sql.get("SELECT * FROM cluster WHERE rep_accession = ?", req.params.cluster);
    result.lca_tax_id = tree.getNode(result.lca_tax_id);
    result.lineage = tree.lineage(result.lca_tax_id);
    res.send(result);
});

app.post('/api/cluster/:cluster/members', async (req, res) => {
    const total = await sql.get("SELECT COUNT(id) as total FROM member WHERE rep_accession = ?", req.params.cluster);
    let result;
    if (req.body.tax_id) {
        result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ?
            ORDER BY id;
        `, req.params.cluster);
        result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id) });
        result = result.filter((x) => {
            let currNode = x.tax_id;
            while (currNode.id != 1) {
                if (currNode.id == req.body.tax_id.value) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
        if (result && result.length > 0) {
            result = result.slice((req.body.page - 1) * req.body.itemsPerPage, req.body.page * req.body.itemsPerPage);
        }
    } else {
        result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ?
            ORDER BY id
            LIMIT ? OFFSET ?;
        `, req.params.cluster, req.body.itemsPerPage, (req.body.page - 1) * req.body.itemsPerPage);
        result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id) });
    }
    res.send({ total: total.total, result : result });
});

app.get('/api/cluster/:cluster/members/taxonomy/:suggest', async (req, res) => {
    let result = await sql.all(`
        SELECT tax_id
            FROM member
            WHERE rep_accession = ?;
        `, req.params.cluster);
    let suggestions = {};
    result.forEach((x) => {
        const node = tree.getNode(x.tax_id);
        tree.lineage(node).forEach((y) => {
            if (y.name.toLowerCase().startsWith(req.params.suggest.toLowerCase())) {
                suggestions[y.id] = y;
            }
        });
    });
    res.send(Object.values(suggestions).slice(0, 10));
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
        x.lca_tax_id = tree.getNode(x.lca_tax_id);
    });
    if (req.body && req.body.tax_id) {
        result = result.filter((x) => {
            let currNode = x.lca_tax_id;
            while (currNode.id != 1) {
                if (currNode.id == req.body.tax_id.value) {
                    return true;
                }
                currNode = tree.getNode(currNode.parent);
            }
            return false;
        });
    }
    res.send(result.sort((a, b) => {
        const valA = Number(a.evalue);
        const valB = Number(b.evalue);
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    }).filter((x) => x.rep_accession != cluster));
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
    result.forEach((x) => {
        const node = tree.getNode(x.lca_tax_id);
        tree.lineage(node).forEach((y) => {
            if (y.name.toLowerCase().startsWith(req.params.suggest.toLowerCase())) {
                suggestions[y.id] = y;
            }
        });
    });
    res.send(Object.values(suggestions).slice(0, 10));
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
    res.send({ error: err });
});

app.listen(port, () => {
    console.log(`AFDB-clusters server listening on port ${port}`)
});
