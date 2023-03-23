import express from 'express';
import cors from 'cors';
import axios from 'axios';

import DbReader from './dbreader.mjs';
import read from './compressed_ca.mjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
    const result = await sql.get("SELECT * FROM member as m LEFT JOIN cluster as c ON m.cluster_id == c.id WHERE accession = ?", "abc");
    res.send([ result ]);
});

app.post('/api/cluster/:cluster', async (req, res) => {
    const result = await sql.get("SELECT * FROM cluster WHERE rep_accession = ?", req.params.cluster);
    res.send(result);
});

app.get('/api/structure/:structure', async (req, res) => {
    try {
        const structure = req.params.structure;
        const aaKey = aaDb.id(structure);
        const aa = aaDb.data(aaKey.value).toString('utf-8');
        const aaLength = aaDb.length(aaKey.value) - 2;
        console.log(structure, aaKey, aa, aaLength);

        const key = caDb.id(structure);
        const ca = caDb.data(key.value);
        const size = caDb.length(key.value);
        console.log(key, ca, size);
        const result = Array.from(read(ca, aaLength, size)).map((x) => x.toFixed(3));
        res.send({ seq: aa, coordinates: result });
    } catch (e) {
        console.log(e);
        res.send({ seq: "", coordinates: [] });
    }
});

app.listen(port, () => {
    console.log(`AFDB-clusters server listening on port ${port}`)
})