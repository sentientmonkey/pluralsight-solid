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

export class FileStore {
    workingDirectory: DirectoryInfo;
    cache: Cache;

    constructor(workingDirectory: DirectoryInfo) {
        this.workingDirectory = workingDirectory;
        this.cache = new Cache();
    }

    save(id: number, message: string): void {
        Log.information(`Saving message ${id}.`);
        var file = this.getFileInfo(id);
        fs.writeFileSync(file.fullName, message);
        this.cache.addOrUpdate(id, message, (i, s) => message);
        Log.information(`Saved message ${id}.`);
    }

    read(id: number): Maybe<string> {
        Log.debug(`Reading message ${id}.`);
        var file = this.getFileInfo(id);
        if (!file.exists()) {
            Log.debug(`No message ${id} found.`);
            return new Maybe();
        }
        var message = this.cache.getOrAdd(id, () => fs.readFileSync(file.fullName).toString());
        Log.debug(`Returning message ${id}.`);
        return new Maybe(message);
    }

    getFileInfo(id: number): FileInfo {
        var fullName = path.join(this.workingDirectory, id + ".txt");
        return new FileInfo(fullName);
    }
}

