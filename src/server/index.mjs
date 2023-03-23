import express from 'express';
import cors from 'cors';
import axios from 'axios';

import DbReader from './dbreader.mjs';
import read from './compressed_ca.mjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import { serializeTree, unserializeTree } from './ncbitaxonomy.mjs';
import { existsSync } from 'fs';

if (!existsSync('./data/ncbitaxonomy.json')) {
    await serializeTree('./data', './data/ncbitaxonomy.json');
}
const tree = unserializeTree('./data/ncbitaxonomy.json');

const sql = await open({
    filename: './data/afdb-clusters.sqlite3',
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READONLY,
})

const aaDb = new DbReader();
await aaDb.make('./data/qdb', './data/qdb.index');

const caDb = new DbReader();
await caDb.make('./data/qdb_ca', './data/qdb_ca.index');

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
    let result = await sql.get("SELECT * FROM member as m LEFT JOIN cluster as c ON m.cluster_id == c.id WHERE accession = ?", "d1jl7a_");
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
    const cluster_id = await sql.get("SELECT id FROM cluster WHERE rep_accession = ?", req.params.cluster);
    const total = await sql.get("SELECT COUNT(id) as total FROM member WHERE cluster_id = ?", cluster_id.id);
    let result = await sql.all(`
        SELECT * 
            FROM member
            WHERE cluster_id = ?
            ORDER BY id
            LIMIT ? OFFSET ?;
        `, cluster_id.id, req.body.itemsPerPage, (req.body.page - 1) * req.body.itemsPerPage);
    result.forEach((x) => { x.tax_id = tree.getNode(x.tax_id) });
    res.send({ total: total.total, result : result });
});

app.get('/api/structure/:structure', async (req, res) => {
    try {
        const structure = req.params.structure;
        const aaKey = aaDb.id(structure);
        const aa = aaDb.data(aaKey.value).toString('utf-8');
        const aaLength = aaDb.length(aaKey.value) - 2;

        const key = caDb.id(structure);
        const ca = caDb.data(key.value);
        const size = caDb.length(key.value);
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