import { Stage, ColormakerRegistry } from 'ngl';
import { pulchra } from 'pulchra-wasm';


const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

function mockPDB(ca, seq) {
    const chainLength = ca.length / 3;
    const pdb = new Array()
    let j = 0;
    for (let i = 0; i < ca.length; i+=3, j++) {
        const line = 'ATOM  '
            + j.toString().padStart(5)
            + '  CA  ' + oneToThree[seq != "" && (ca.length/3) == seq.length ? seq[i/3] : 'A'] + ' A'
            + j.toString().padStart(4)
            + '    '
            + ca[0 * chainLength + j].toString().padStart(8)
            + ca[1 * chainLength + j].toString().padStart(8)
            + ca[2 * chainLength + j].toString().padStart(8)
            + '  1.00  0.00           C  ';
        pdb.push(line);
    }
    return pdb.join('\n')
}

var discreteBfactor = ColormakerRegistry.addScheme(function (params) {
  this.atomColor = function (atom) {
    if (atom.bfactor >= 9) {
      return 0x0000F5;  // blue
    } else if (atom.bfactor >= 7) {
      return 0x00FFFF;  // cyan
    } else if (atom.bfactor >= 5) {
      return 0xFFFF00;  // yellow
    } else {
      return 0xFFA500;  // orange
    }
  };
});

export class NglService {
    constructor() {
        const div = document.createElement("div");
        div.style.width = '100px';
        div.style.height = '100px';
        div.style.position = 'absolute';
        div.style.top = '0';
        div.style.left = '-1000px';
        div.style.zIndex = '-999';
        div.ariaHidden = true;
        document.querySelector("body").appendChild(div);
        this.stage = new Stage(div,{
            clipNear: -1000,
            clipFar: 1000,
            fogFar: 1000,
            fogNear: -1000,
            quality: 'high',
            tooltip: false,
        });
        this.stage.log = () => {};
        this.promise = Promise.resolve();
    }

    makeImage(seq, plddt, coordinates) {
      return new Promise((resolve) => {
        this.promise = this.promise.then(() => {
          const next = this._makeImage(seq, plddt, coordinates)
          resolve(next);
          return next;
        });
      });
    }

    _makeImage(seq, plddt, coordinates) {
        return pulchra(mockPDB(coordinates, seq))
            .then((fullPDB) => {
                this.stage.removeAllComponents();
                return this.stage.loadFile(new Blob([fullPDB], { type: 'text/plain' }), {ext: 'pdb', firstModelOnly: true})

            })
            .then((structure) => {
                structure.structure.eachAtom((ap) => {
                    ap.bfactor = (+(plddt[ap.resno - 1]));
                });
                structure.addRepresentation("cartoon", { color: discreteBfactor })
                this.stage.autoView()
                this.stage.viewer.setLight(undefined, undefined, undefined, 0.2)
                return this.stage.makeImage({
                    trim: false,
                    factor: 1,
                    antialias: true,
                    transparent: true,
                })
            })
    }

    dispose() {
        this.stage.dispose();
    }
}
