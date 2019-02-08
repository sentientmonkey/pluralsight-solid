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

interface IStoreWriter {
    save(id: number, message: string): void;
}

class CompositeStoreWriter implements IStoreWriter {
    private writers: IStoreWriter[];

    constructor(...writers: IStoreWriter[]) {
        this.writers = writers;
    }

    save(id: number, message: string): void {
        this.writers.forEach((w) => w.save(id, message));
    }
}

interface IStoreCache {
    save(id: number, message: string): void;
    getOrAdd(id: number, f: () => Maybe<string>): Maybe<string>;
}

class StoreCache {
    private cache: Map<number, Maybe<string>>;

    constructor() {
        this.cache = new Map<number, Maybe<string>>();
    }

    save(id: number, message: string): void {
        this.cache.set(id, new Maybe(message));
    }

    getOrAdd(id: number, f: () => Maybe<string>): Maybe<string> {
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

interface IStoreLogger {
    Saving(id: number, message: string): void;
    Saved(id: number, message: string): void;
    Reading(id: number): void;
    DidNotFind(id: number): void;
    Returning(id: number): void;
}

class StoreLogger implements IStoreLogger {
    Saving(id: number, message: string): void {
        Log.information(`Saving message ${id}.`);
    }

    Saved(id: number, message: string): void {
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

class LogSavingStoreWriter implements IStoreWriter {
    save(id: number, message: string): void {
        Log.information(`Saving message ${id}.`);
    }
}

class LogSavedStoreWriter implements IStoreWriter {
    save(id: number, message: string): void {
        Log.information(`Saved message ${id}.`);
    }
}

interface IStore {
    save(id: number, message: string): void;
    readFileSync(id: number): Maybe<string>;
}

interface IFileLocator {
    getFileInfo(id: number): FileInfo;
}

class FileStore implements IStore, IFileLocator {
    workingDirectory: DirectoryInfo;

    constructor(workingDirectory: DirectoryInfo) {
        if (workingDirectory == null) {
            throw new ArgumentNullError("Working Directory missing.");
        }
        if (!workingDirectory.exists()) {
            throw new ArgumentError("Working Directory does not exist.");
        }
        this.workingDirectory = workingDirectory;
    }

    save(id: number, message: string) {
        var path = this.getFileInfo(id).fullName;
        fs.writeFileSync(path, message);
    }

    readFileSync(id: number): Maybe<string> {
        var file = this.getFileInfo(id);
        if (!file.exists()) {
            return new Maybe();
        }

        var path = file.fullName;
        return new Maybe(fs.readFileSync(path).toString());
    }

    getFileInfo(id: number): FileInfo {
        var fullName = path.join(this.workingDirectory.fullName, id + ".txt");
        return new FileInfo(fullName);
    }
}

export class MessageStore {
    workingDirectory: DirectoryInfo;
    private cache: IStoreCache;
    private log: IStoreLogger;
    private store: IStore;
    private fileLocator: IFileLocator;
    private writer: IStoreWriter;

    constructor(workingDirectory: DirectoryInfo) {
        if (workingDirectory == null) {
            throw new ArgumentNullError("Working Directory missing.");
        }
        if (!workingDirectory.exists()) {
            throw new ArgumentError("Working Directory does not exist.");
        }
        this.workingDirectory = workingDirectory;
        var c = new StoreCache()
        this.cache = c
        this.log = new StoreLogger();
        var fileStore = new FileStore(this.workingDirectory);
        this.store = fileStore;
        this.fileLocator = fileStore;
        this.writer = new CompositeStoreWriter(
            new LogSavingStoreWriter(),
            fileStore,
            c,
            new LogSavedStoreWriter()
        )
    }

    save(id: number, message: string): void {
        this.writer.save(id, message);
    }

    read(id: number): Maybe<string> {
        this.log.Reading(id);
        var message = this.cache.getOrAdd(
            id,
            () => this.store.readFileSync(id));
        if (message.any())
            this.log.Returning(id);
        else
            this.log.DidNotFind(id);
        return message;
    }

    getFileInfo(id: number): FileInfo {
        return this.fileLocator.getFileInfo(id);
    }
}

