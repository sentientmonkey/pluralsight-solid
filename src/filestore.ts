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

interface IStoreReader {
    read(id: number): Maybe<string>;
}


interface IStoreCache {
    save(id: number, message: string): void;
    read(id: number): Maybe<string>;
}

class StoreCache implements IStoreCache, IStoreWriter, IStoreReader {
    private cache: Map<number, Maybe<string>>;
    private writer: IStoreWriter;
    private reader: IStoreReader;

    constructor(writer: IStoreWriter, reader: IStoreReader) {
        this.cache = new Map<number, Maybe<string>>();
        this.writer = writer;
        this.reader = reader;
    }

    save(id: number, message: string): void {
        this.writer.save(id, message);
        this.cache.set(id, new Maybe(message));
    }

    read(id: number): Maybe<string> {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        var retVal = this.reader.read(id);
        if (retVal.any())
            this.cache.set(id, retVal);

        return new Maybe();
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

class StoreLogger implements IStoreLogger, IStoreWriter, IStoreReader {
    private writer: IStoreWriter;
    private reader: IStoreReader;

    constructor(writer: IStoreWriter, reader: IStoreReader) {
        this.writer = writer;
        this.reader = reader;
    }

    save(id: number, message: string): void {
        Log.information(`Saving message ${id}.`);
        this.writer.save(id, message);
        Log.information(`Saved message ${id}.`);
    }

    read(id: number): Maybe<string> {
        Log.debug(`Reading message ${id}.`);
        var retVal = this.reader.read(id)
        if (retVal.any())
            Log.debug(`Returning message ${id}.`);
        else
            Log.debug(`No message ${id} found.`);
        return retVal;
    }

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
    read(id: number): Maybe<string>;
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

    read(id: number): Maybe<string> {
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
    private reader: IStoreReader;

    constructor(workingDirectory: DirectoryInfo) {
        this.workingDirectory = workingDirectory;
        var fileStore = new FileStore(this.workingDirectory);
        var c = new StoreCache(fileStore, fileStore);
        this.cache = c
        var l = new StoreLogger(c, c);
        this.log = l;
        this.store = fileStore;
        this.fileLocator = fileStore;
        this.writer = l;
        this.reader = l;
    }

    save(id: number, message: string): void {
        this.writer.save(id, message);
    }

    read(id: number): Maybe<string> {
        return this.reader.read(id)
    }

    getFileInfo(id: number): FileInfo {
        return this.fileLocator.getFileInfo(id);
    }
}

