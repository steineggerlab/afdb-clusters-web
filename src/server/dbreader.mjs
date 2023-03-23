import { openSync, readSync, closeSync, createReadStream } from 'fs';
import { createInterface } from 'readline';

export default class DbReader {
    constructor() {
        this.keys = [];
        this.offsets = [];
        this.lengths = [];
        this.file = null;
        this.numericKeys = true;
    }
    
    async make(dataFile, indexFile) {
        if (dataFile != null) {
            this.file = openSync(dataFile, 'r');
        }
        
        const rl = createInterface({
            input: createReadStream(indexFile),
            crlfDelay: Infinity,
        });
        
        let prevKey = null;
        let sorted = true;
        
        for await (const line of rl) {
            let [key, offset, length] = line.split('\t');
            if (Number.isInteger(Number(key))) {
                key = Number(key);
            } else {
                this.numericKeys = false;
            }
            sorted = sorted && (!prevKey || prevKey <= key);
            prevKey = key;
            this.keys.push(key);
            this.offsets.push(Number(offset));
            this.lengths.push(Number(length));
        }
        
        if (!sorted) {
            this.sortIndex();
        }
    }
    
    sortIndex() {
        const indices = Array.from({ length: this.keys.length }, (_, i) => i);
        indices.sort((a, b) => {
            if (this.keys[a] < this.keys[b]) {
                return -1;
            } else if (this.keys[a] > this.keys[b]) {
                return 1;
            } else {
                return 0;
            }
        });
        this.keys = this.reorderArray(this.keys, indices, this.numericKeys ? Uint32Array : Array);
        this.offsets = this.reorderArray(this.offsets, indices, Uint32Array);
        this.lengths = this.reorderArray(this.lengths, indices, Uint32Array);
    }
    
    reorderArray(arr, indexes, type) {
        const result = new type(arr.length);
        for (let i = 0; i < arr.length; i++) {
            result[i] = arr[indexes[i]];
        }
        return result;
    }
    
    delete() {
        if (this.file != null) {
            closeSync(this.file);
        }
    }
    
    id(key) {
        const i = this.search(key);
        return { value: i, found: i < this.size() && this.keys[i] == key };
    }
    
    search(key) {
        let left = 0;
        let right = this.size() - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.keys[mid] == key) {
                return mid;
            } else if (this.keys[mid] < key) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return left;
    }
    
    key(id) {
        if (id < 0 || id >= this.size()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.keys[id];
    }
    
    offset(id) {
        if (id < 0 || id >= this.size()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.offsets[id];
    }
    
    length(id) {
        if (id < 0 || id >= this.size()) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.lengths[id];
    }
    
    data(id) {
        if (id < 0 || id >= this.size()) {
            return '';
        }
        if (this.file == null) {
            return '';
        }
        const length = this.lengths[id] - 1;
        const buffer = Buffer.alloc(length);
        readSync(this.file, buffer, 0, length, this.offsets[id]);
        return buffer;
    }
    
    size() {
        return this.keys.length;
    }
}