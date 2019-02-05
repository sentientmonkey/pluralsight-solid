import fs = require('fs');
import path = require('path');
import { Maybe } from "./maybe";

export { Maybe };

export type DirectoryInfo = string;

export class FileInfo {
    fullName: string;

    constructor(fullName: string) {
        this.fullName = fullName;
    }

    exists(): boolean {
        return fs.existsSync(this.fullName);
    }
}

class StoreCache {
    private cache: Map<number, string>;

    constructor() {
        this.cache = new Map<number, string>();
    }

    addOrUpdate(id: number, message: string): void {
        this.cache.set(id, message);
    }

    getOrAdd(id: number, f: () => string): string {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        var value = f();
        this.cache.set(id, value);
        return value;
    }
}

class Log {
    static debug(msg: string): void {
        console.log("[DEBUG] " + msg);
    }

    static information(msg: string): void {
        console.log("[INFO] " + msg);
    }
}

class StoreLogger {
    Saving(id: number): void {
        Log.information(`Saving message ${id}.`);
    }

    Saved(id: number): void {
        Log.information(`Saved message ${id}.`);
    }

    Reading(id: number): void {
        Log.debug(`Reading message ${id}.`);
    }

    DidNotFind(id: number): void {
        Log.debug(`No message ${id} found.`);
    }

    Returning(id: number): void {
        Log.debug(`Returning message ${id}.`);
    }
}

class FileStore {
    writeFileSync(path: string, message: string) {
        fs.writeFileSync(path, message);
    }

    readFileSync(path: string): string {
        return fs.readFileSync(path).toString();
    }

    getFileInfo(id: number, workingDirectory: string): FileInfo {
        var fullName = path.join(workingDirectory, id + ".txt");
        return new FileInfo(fullName);
    }
}

export class MessageStore {
    workingDirectory: DirectoryInfo;
    private cache: StoreCache;
    private log: StoreLogger;
    private fileStore: FileStore;

    constructor(workingDirectory: DirectoryInfo) {
        this.workingDirectory = workingDirectory;
        this.cache = new StoreCache();
        this.log = new StoreLogger();
        this.fileStore = new FileStore();
    }

    save(id: number, message: string): void {
        this.log.Saving(id);
        var file = this.fileStore.getFileInfo(id, this.workingDirectory);
        this.fileStore.writeFileSync(file.fullName, message);
        this.cache.addOrUpdate(id, message);
        this.log.Saved(id);
    }

    read(id: number): Maybe<string> {
        this.log.Reading(id);
        var file = this.fileStore.getFileInfo(id, this.workingDirectory);
        if (!file.exists()) {
            this.log.DidNotFind(id);
            return new Maybe();
        }
        var message = this.cache.getOrAdd(id, () => this.fileStore.readFileSync(file.fullName));
        this.log.Returning(id);
        return new Maybe(message);
    }
}

