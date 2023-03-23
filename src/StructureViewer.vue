<template>
    <div class="structure-panel">
        <div class="structure-wrapper" ref="structurepanel">
            <v-tooltip open-delay="300" bottom attach=".structure-wrapper" background-color="transparent">
                <template v-slot:activator="{ on }">
                    <v-icon :light="isFullscreen" v-on="on" style="position: absolute; z-index: 999; right:0">{{ $MDI.HelpCircleOutline }}</v-icon>
                </template>
                <span>
                    <dl style="text-align: center;">
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Left click</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="left" d="M15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Z" style="fill:red"/>
<path id="middle-inactive" d="M14.6 4h2.8v8h-2.8z"/>
</svg>
                        </dt>
                        <dd>
                            Rotate
                        </dd>
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Right click</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="right" d="M16.5 2h4a4 4 0 0 1 4 3.8v8.5h-8V2Z" style="fill:red"/>
<path id="middle-inactive" d="M14.6 4h2.8v8h-2.8z"/>
</svg>
                        </dt>
                        <dd>
                            Pan
                        </dd>
                        <dt>
<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2" viewBox="0 0 32 32">
<title>Scroll wheel</title>
<path d="M25.6 5.8a5 5 0 0 0-5-4.8h-9.1a5 5 0 0 0-5.1 4.8v20.4a5 5 0 0 0 5 4.8h9.1a5 5 0 0 0 5.1-4.8V5.8Zm-1 9.5v10.9a4 4 0 0 1-4 3.8h-9.1a4 4 0 0 1-4-3.8V15.3h17ZM15.5 2v12.3h-8V5.8a4 4 0 0 1 4-3.8h4Zm1 0h4a4 4 0 0 1 4 3.8v8.5h-8V2Z"/>
<path id="middle-active" d="M14.6 4h2.8v8h-2.8z" style="fill:red"/>
</svg>
                        </dt>
                        <dd>
                            Zoom
                        </dd>
                    </dl>
                </span>
            </v-tooltip>
            <div class="toolbar-panel">
                <v-item-group class="v-btn-toggle" :light="isFullscreen">
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="makePdb()"
                    title="Save PDB"
                >
                    <v-icon v-bind="tbIconBindings">M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h14Zm0 8v-.8c0-.7-.6-1.2-1.3-1.2h-2.4v6h2.4c.7 0 1.2-.5 1.2-1.2v-1c0-.4-.4-.8-.9-.8.5 0 1-.4 1-1Zm-9.7.5v-1c0-.8-.7-1.5-1.5-1.5H5.3v6h1.5v-2h1c.8 0 1.5-.7 1.5-1.5Zm5 2v-3c0-.8-.7-1.5-1.5-1.5h-2.5v6h2.5c.8 0 1.5-.7 1.5-1.5Zm3.4.3h-1.2v-1.2h1.2v1.2Zm-5.9-3.3v3h1v-3h-1Zm-5 0v1h1v-1h-1Zm11 .9h-1.3v-1.2h1.2v1.2Z</v-icon>
                    <span v-if="isFullscreen">&nbsp;Save PDB</span>
                </v-btn>
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="makeImage()"
                    title="Save image"
                >
                    <v-icon v-bind="tbIconBindings">M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3M9 11.5C9 12.3 8.3 13 7.5 13H6.5V15H5V9H7.5C8.3 9 9 9.7 9 10.5V11.5M14 15H12.5L11.5 12.5V15H10V9H11.5L12.5 11.5V9H14V15M19 10.5H16.5V13.5H17.5V12H19V13.7C19 14.4 18.5 15 17.7 15H16.4C15.6 15 15.1 14.3 15.1 13.7V10.4C15 9.7 15.5 9 16.3 9H17.6C18.4 9 18.9 9.7 18.9 10.3V10.5H19M6.5 10.5H7.5V11.5H6.5V10.5Z</v-icon>
                    <span v-if="isFullscreen">&nbsp;Save image</span>
                </v-btn>
                <v-btn
                    v-bind="tbButtonBindings"
                    v-on:click="resetView()"
                    title="Reset the view to the original position and zoom level"
                >
                    <v-icon v-bind="tbIconBindings">{{ $MDI.Restore }}</v-icon>
                    <span v-if="isFullscreen">&nbsp;Reset view</span>
                </v-btn>
                <v-btn v-bind="tbButtonBindings"
                    v-on:click="toggleFullscreen()"
                    title="Enter fullscreen mode - press ESC to exit"
                >
                    <v-icon v-bind="tbIconBindings">{{ $MDI.Fullscreen }}</v-icon>
                    <span v-if="isFullscreen">&nbsp;Fullscreen</span>
                </v-btn>
                </v-item-group>
            </div>
            <div class="structure-viewer" ref="viewport"></div>
        </div>
    </div>
</template>

<script>
import { Shape, Stage, Selection, download, ColormakerRegistry, PdbWriter } from 'ngl';
import Panel from './Panel.vue';
import { pulchra } from 'pulchra-wasm';
// import { tmalign, parse, parseMatrix } from 'tmalign-wasm';


// Create NGL arrows from array of ([X, Y, Z], [X, Y, Z]) pairs
// function createArrows(matches) {
//     const shape = new Shape('shape')
//     for (let i = 0; i < matches.length; i++) {
//         const [a, b] = matches[i]
//         shape.addArrow(a, b, [0, 1, 1], 0.4)
//     }
//     return shape
// }

const oneToThree = {
  "A":"ALA", "R":"ARG", "N":"ASN", "D":"ASP",
  "C":"CYS", "E":"GLU", "Q":"GLN", "G":"GLY",
  "H":"HIS", "I":"ILE", "L":"LEU", "K":"LYS",
  "M":"MET", "F":"PHE", "P":"PRO", "S":"SER",
  "T":"THR", "W":"TRP", "Y":"TYR", "V":"VAL",
  "U":"SEC", "O":"PHL", "X":"XAA"
};

/**
 * Create a mock PDB from Ca data
 * Follows the spacing spec from https://www.wwpdb.org/documentation/file-format-content/format33/sect9.html#ATOM
 * Will have to change if/when swapping to fuller data
 */
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

/* ------ The rotation matrix to rotate Chain_1 to Chain_2 ------ */
/* m               t[m]        u[m][0]        u[m][1]        u[m][2] */
/* 0     161.2708425765   0.0663961888  -0.6777150909  -0.7323208325 */
/* 1     109.4205584665  -0.9559071424  -0.2536229340   0.1480437178 */
/* 2      29.1924015422  -0.2860648199   0.6902011757  -0.6646722921 */
/* Code for rotating Structure A from (x,y,z) to (X,Y,Z): */
/* for(i=0; i<L; i++) */
/* { */
/*    X[i] = t[0] + u[0][0]*x[i] + u[0][1]*y[i] + u[0][2]*z[i]; */
/*    Y[i] = t[1] + u[1][0]*x[i] + u[1][1]*y[i] + u[1][2]*z[i]; */
/*    Z[i] = t[2] + u[2][0]*x[i] + u[2][1]*y[i] + u[2][2]*z[i]; */
/* } */
const transformStructure = (structure, t, u) => {
    structure.eachAtom(atom => {
        const [x, y, z] = [atom.x, atom.y, atom.z]
        atom.x = t[0] + u[0][0] * x + u[0][1] * y + u[0][2] * z
        atom.y = t[1] + u[1][0] * x + u[1][1] * y + u[1][2] * z
        atom.z = t[2] + u[2][0] * x + u[2][1] * y + u[2][2] * z
    })
    return structure
}

// Get XYZ coordinates of CA of a given residue
const xyz = (structure, resIndex) => {
    var rp = structure.getResidueProxy()
    var ap = structure.getAtomProxy()
    rp.index = resIndex
    ap.index = rp.getAtomIndexByName('CA')
    return [ap.x, ap.y, ap.z]
}

// Given an NGL AtomProxy, return the corresponding PDB line
const atomToPDBRow = (ap) => {
    const { serial, atomname, resname, chainname, resno, inscode, x, y, z } = ap
    return `ATOM  ${serial.toString().padStart(5)}${atomname.padStart(4)}  ${resname.padStart(3)} ${chainname.padStart(1)}${resno.toString().padStart(4)} ${inscode.padStart(1)}  ${x.toFixed(3).padStart(8)}${y.toFixed(3).padStart(8)}${z.toFixed(3).padStart(8)}`
}

// Map 1-based indices in a selection to residue index/resno
const makeChainMap = (structure, sele) => {
    let idx = 1
    let map = new Map()
    structure.eachResidue(rp => { map.set(idx++, { index: rp.index, resno: rp.resno }) }, new Selection(sele))
    return map
}

// Generate a subsetted PDB file from a structure and selection
const makeSubPDB = (structure, sele) => {
    let pdb = []
    structure.eachAtom(ap => { pdb.push(atomToPDBRow(ap)) }, new Selection(sele))
    return pdb.join('\n')
}

export default {
    components: { Panel },
    data: () => ({
        representation: null,
        'isFullscreen': false,
    }),
    props: {
        'structure': Object,
        'bgColorLight': { type: String, default: "white" },
        'bgColorDark': { type: String, default: "#eee" },
    },
    methods: {
        handleResize() {
            if (!this.stage) return
            this.stage.handleResize()
        },
        toggleFullscreen() {
            if (!this.stage) return
            this.stage.toggleFullscreen(this.$refs.structurepanel)
        },
        resetView() {
            if (!this.stage) return
            this.setSelection(this.showTarget)
            this.stage.autoView(100)
        },
        makeImage() {
            if (!this.stage) return
            this.stage.viewer.setLight(undefined, undefined, undefined, 0.2)
            this.stage.makeImage({
                trim: true,
                factor: (this.isFullscreen) ? 1 : 8,
                antialias: true,
                transparent: true,
            }).then((blob) => {
                this.stage.viewer.setLight(undefined, undefined, undefined, this.$vuetify.theme.dark ? 0.4 : 0.2)
                download(blob, this.$route.cluster + ".png")
            })
        },
        makePdb() {
            if (!this.stage) return
            if (!this.repr) return
            let pdb = new PdbWriter(this.representation.repr.structure, { renumberSerial: false }).getData()
            pdb = pdb.split('\n').filter(line => line.startsWith('ATOM')).join('\n')
            let result =
`TITLE     ${this.$route.cluster}
REMARK     This file was generated by the Foldseek webserver:
REMARK       https://search.foldseek.com
REMARK     Please cite:
REMARK       https://doi.org/10.1101/2022.02.07.479398
REMARK     Warning: Non C-alpha atoms were re-generated by PULCHRA.
${pdb}
END
`
            download(new Blob([result], { type: 'text/plain' }), this.$route.cluster + ".pdb")
        }
    },
    computed: {
        tbIconBindings: function() {
            return (this.isFullscreen) ? { 'right': true } : {}
        },
        tbButtonBindings: function() {
            return (this.isFullscreen) ? {
                'small': false,
                'style': 'margin-bottom: 15px;',
            } : {
                'small': true,
                'style': ''
            }
        }
    },
    mounted() {
        const bgColor = this.$vuetify.theme.dark ? this.bgColorDark : this.bgColorLight;
        const ambientIntensity = this.$vuetify.theme.dark ? 0.4 : 0.2;
        this.stage = new Stage(this.$refs.viewport,
            {
                backgroundColor: bgColor,
                ambientIntensity: ambientIntensity,
                clipNear: -1000,
                clipFar: 1000,
                fogFar: 1000,
                fogNear: -1000,
                quality: 'high'
            })

        pulchra(mockPDB(this.structure.coordinates, this.structure.seq))
            .then((response) => {
                return this.stage.loadFile(new Blob([response], { type: 'text/plain' }), {ext: 'pdb', firstModelOnly: true})
            }).then((structure) => {
                this.representation = structure.addRepresentation("cartoon")
                this.stage.autoView()
            })

        window.addEventListener('resize', this.handleResize)
        this.stage.signals.fullscreenChanged.add((isFullscreen) => {
            if (isFullscreen) {
                this.stage.viewer.setBackground('#ffffff')
                this.stage.viewer.setLight(undefined, undefined, undefined, 0.2)
                this.isFullscreen = true
            } else {
                this.stage.viewer.setBackground(bgColor)
                this.stage.viewer.setLight(undefined, undefined, undefined, ambientIntensity)
                this.isFullscreen = false
            }
        })
    },
    beforeDestroy() {
        if (typeof(this.stage) == 'undefined')
            return
        this.stage.dispose() 
        window.removeEventListener('resize', this.handleResize)
    }
}
</script>

<style>
.structure-wrapper {
    width: 400px;
    height: 300px;
    margin: 0 auto;
}

.theme--dark .structure-wrapper .v-tooltip__content {
    background: rgba(97, 97, 97, 0.3);
}

.structure-viewer {
    width: 100%;
    height: 100%;
}

.structure-viewer canvas {
    border-radius: 2px;
}

.structure-panel {
    position: relative;
}

.toolbar-panel {
    display: inline-flex;
    flex-direction: row;
    position: absolute;
    justify-content: center;
    width: 100%;
    bottom: 0;
    z-index: 1;
    left: 0;
}
</style>
