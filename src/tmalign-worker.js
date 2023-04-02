import { tmalign, parseMatrix } from 'tmalign-wasm';

self.onmessage = ({ data: { pdb1, pdb2 } }) => {
    tmalign(pdb1, pdb2).then((tm) => {
        const {t, u} = parseMatrix(tm.matrix);
        self.postMessage({ t, u });
    });
};