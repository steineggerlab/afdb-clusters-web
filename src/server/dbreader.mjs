import { openSync, readSync, closeSync, createReadStream } from 'fs';
import { createInterface } from 'readline';
import TSVReader from './tsvreader.js';

export default class DbReader {
    constructor() {
        this.index = null;
        this.size = 0;
        this.file = null;
        this.numericKeys = true;
    }
    
    async make(dataFile, indexFile) {
        if (dataFile != null) {
            this.file = openSync(dataFile, 'r');
        }

        this.index = new TSVReader();
        return new Promise((resolve, reject) => {
            this.index.readFile(indexFile, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    this.size = this.index.getSize();
                    resolve();
                }
            });
        });
    }
    
    delete() {
        if (this.file != null) {
            closeSync(this.file);
        }
    }
    
    id(key) {
        const i = this.search(key);
        return { value: i, found: i < this.size && this.index.getKey(i) == key };
    }
    
    search(key) {
        let left = 0;
        let right = this.size - 1;
        
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.index.getKey(mid) == key) {
                return mid;
            } else if (this.index.getKey(mid) < key) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        return left;
    }
    
    key(id) {
        if (id < 0 || id >= this.size) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.index.getKey(id);
    }
    
    offset(id) {
        if (id < 0 || id >= this.size) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.index.getOffset(id);
    }
    
    length(id) {
        if (id < 0 || id >= this.size) {
            return Number.MAX_SAFE_INTEGER;
        }
        return this.index.getLength(id);
    }
    
    data(id) {
        if (id < 0 || id >= this.size) {
            return '';
        }
        if (this.file == null) {
            return '';
        }
        const length = this.index.getLength(id) - 1;
        const buffer = Buffer.alloc(length);
        readSync(this.file, buffer, 0, length, this.index.getOffset(id));
        return buffer;
    }
}