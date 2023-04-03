import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync, unlinkSync } from 'fs';
import { sha256 } from './utils.mjs';
const { join } = await import('node:path');


export default class FileCache {
    constructor(path, options = {}) {
        this.cachePath = path;
        this.cleanupTimeout = null;
        this.options = {
            cleanupInterval: 60 * 60 * 1000,
            maxAge: 24 * 60 * 60 * 1000,
            autoCleanup: true,
            ...options,
        };
        mkdirSync(this.cachePath, { recursive: true, mode: 0o755 });
        if (this.options.autoCleanup) {
            this.setupCleanup();
        }
    }

    add(content, data) {
        writeFileSync(join(this.cachePath, this.hash(content)), data);
    }

    contains(content) {
        return existsSync(join(this.cachePath, this.hash(content)));
    }

    get(content) {
        return readFileSync(join(this.cachePath, this.hash(content))).toString();
    }

    hash(content) {
        return sha256(content);
    }

    cleanup() {
        const cutoff = Date.now() - (this.options.maxAge);
        const files = readdirSync(this.cachePath);
        for (const file of files) {
            const { birthtimeMs } = statSync(join(this.cachePath, file));
            if (birthtimeMs < cutoff) {
                unlinkSync(join(this.cachePath, file));
            }
        }
    }

    setupCleanup() {
        if (this.cleanupTimeout) {
            this.stopCleanup();
        }
        this.cleanupTimeout = setInterval(() => {
            this.cleanup();
        }, this.options.cleanupInterval);
    }

    stopCleanup() {
        clearInterval(this.cleanupTimeout);
        this.cleanupTimeout = null;        
    }
}