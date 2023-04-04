import { tmalign, parseMatrix, parse } from 'tmalign-wasm';

self.onmessage = ({ data: { pdb1, pdb2 } }) => {
    tmalign(pdb1, pdb2).then((tm) => {
        const {t, u} = parseMatrix(tm.matrix);
        const output = parse(tm.output);
        self.postMessage({ matrix: { t, u }, output: output });
    });
};