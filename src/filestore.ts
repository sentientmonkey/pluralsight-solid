import fs = require('fs');
import path = require('path');
import { Maybe } from "./maybe";

export { Maybe };

export class ArgumentNullError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ArgumentError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class DirectoryInfo {
    fullName: string;

    constructor(fullName: string) {
        this.fullName = fullName;
    }

    exists(): boolean {
        return fs.existsSync(this.fullName);
    }
}

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

interface IStore {
    writeFileSync(path: string, message: string) : void;
    readFileSync(path: string) : string;
    getFileInfo(id: number, workingDirectory: DirectoryInfo): FileInfo;
}

class FileStore implements IStore {
    writeFileSync(path: string, message: string) {
        fs.writeFileSync(path, message);
    }

    readFileSync(path: string): string {
        return fs.readFileSync(path).toString();
    }

    getFileInfo(id: number, workingDirectory: DirectoryInfo): FileInfo {
        var fullName = path.join(workingDirectory.fullName, id + ".txt");
        return new FileInfo(fullName);
    }
}

export class MessageStore {
    workingDirectory: DirectoryInfo;
    private cache: StoreCache;
    private log: StoreLogger;
    private store: IStore;

    constructor(workingDirectory: DirectoryInfo) {
        if (workingDirectory == null) {
            throw new ArgumentNullError("Working Directory missing.");
        }
        if (!workingDirectory.exists()) {
            throw new ArgumentError("Working Directory does not exist.");
        }
        this.workingDirectory = workingDirectory;
        this.cache = new StoreCache();
        this.log = new StoreLogger();
        this.store = new FileStore();
    }

    save(id: number, message: string): void {
        this.log.Saving(id);
        var file = this.store.getFileInfo(id, this.workingDirectory);
        this.store.writeFileSync(file.fullName, message);
        this.cache.addOrUpdate(id, message);
        this.log.Saved(id);
    }

    read(id: number): Maybe<string> {
        this.log.Reading(id);
        var file = this.store.getFileInfo(id, this.workingDirectory);
        if (!file.exists()) {
            this.log.DidNotFind(id);
            return new Maybe();
        }
        var message = this.cache.getOrAdd(id, () => this.store.readFileSync(file.fullName));
        this.log.Returning(id);
        return new Maybe(message);
    }
}

