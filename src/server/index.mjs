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

console.log('Loading All-vs-all database...')
const avaDb = new DbReader();
await avaDb.make(dataPath + '/ava_db', dataPath + '/ava_db.index');
console.timeLog();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((err, req, res, next) => {
    res.status(500);
    res.send({ error: err });
  })

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
    let result = await sql.all(`
        SELECT * 
            FROM member
            WHERE rep_accession = ?
            ORDER BY id
            LIMIT ? OFFSET ?;
        `, req.params.cluster, req.body.itemsPerPage, (req.body.page - 1) * req.body.itemsPerPage);
    result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id) });
    res.send({ total: total.total, result : result });
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
    res.send(result);
});

app.get('/api/structure/:structure', async (req, res) => {
    const structure = req.params.structure;
    const aaKey = aaDb.id(structure);
    if (aaKey.found == false) {
        res.send({ seq: "", coordinates: [] });
        return;
    }
    const aaLength = aaDb.length(aaKey.value) - 2;

    const key = caDb.id(structure);
    if (key.found == false) {
        res.send({ seq: "", coordinates: [] });
        return;
    }
    const size = caDb.length(key.value);
    try {
        const aa = aaDb.data(aaKey.value).toString('utf-8');
        const ca = caDb.data(key.value);
        const result = Array.from(read(ca, aaLength, size)).map((x) => x.toFixed(3));
        res.send({ seq: aa, coordinates: result });
    } catch (e) {
        res.send({ seq: "", coordinates: [] });
    }
});

app.post('/api/taxonomy', async (req, res) => {
    // let node = tree.getNode(9606);
    // tree.lineage(node).forEach(node => console.log(node));
});

app.listen(port, () => {
    console.log(`AFDB-clusters server listening on port ${port}`)
})