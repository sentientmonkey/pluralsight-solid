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

class Cache {
    addOrUpdate(id: number, message: string,
        f: (i: number, s: string) => string)
        : void {
        f(id, message);
    }

    getOrAdd(id: number, f: () => string): string {
        return f();
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

export class FileStore {
    workingDirectory: DirectoryInfo;
    private cache: Cache;
    private log: StoreLogger;

    constructor(workingDirectory: DirectoryInfo) {
        this.workingDirectory = workingDirectory;
        this.cache = new Cache();
        this.log = new StoreLogger();
    }

    save(id: number, message: string): void {
        this.log.Saving(id);
        var file = this.getFileInfo(id);
        fs.writeFileSync(file.fullName, message);
        this.cache.addOrUpdate(id, message, (i, s) => message);
        this.log.Saved(id);
    }

    read(id: number): Maybe<string> {
        this.log.Reading(id);
        var file = this.getFileInfo(id);
        if (!file.exists()) {
            this.log.DidNotFind(id);
            return new Maybe();
        }
        var message = this.cache.getOrAdd(id, () => fs.readFileSync(file.fullName).toString());
        this.log.Returning(id);
        return new Maybe(message);
    }

    getFileInfo(id: number): FileInfo {
        var fullName = path.join(this.workingDirectory, id + ".txt");
        return new FileInfo(fullName);
    }
}

