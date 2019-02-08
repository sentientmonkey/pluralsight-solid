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

export interface IStoreWriter {
    save(id: number, message: string): void;
}

export interface IStoreReader {
    read(id: number): Maybe<string>;
}

export class StoreCache implements IStoreWriter, IStoreReader {
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

export interface ILogger {
    debug(msg: string): void;
    information(msg: string): void;
}

export class Log implements ILogger {
    debug(msg: string): void {
        console.log("[DEBUG] " + msg);
    }

    information(msg: string): void {
        console.log("[INFO] " + msg);
    }
}

export class StoreLogger implements IStoreWriter, IStoreReader {
    private writer: IStoreWriter;
    private reader: IStoreReader;
    private log: ILogger;

    constructor(log: ILogger,
        writer: IStoreWriter,
        reader: IStoreReader) {
        this.log = log
        this.writer = writer;
        this.reader = reader;
    }

    save(id: number, message: string): void {
        this.log.information(`Saving message ${id}.`);
        this.writer.save(id, message);
        this.log.information(`Saved message ${id}.`);
    }

    read(id: number): Maybe<string> {
        this.log.debug(`Reading message ${id}.`);
        var retVal = this.reader.read(id)
        if (retVal.any())
            this.log.debug(`Returning message ${id}.`);
        else
            this.log.debug(`No message ${id} found.`);
        return retVal;
    }
}

export interface IFileLocator {
    getFileInfo(id: number): FileInfo;
}

export class FileStore implements IFileLocator, IStoreWriter, IStoreReader {
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

export class FileMessageStoreFactory {
    static build(path: string): MessageStore {
        var directoryInfo = new DirectoryInfo(path);
        var logger = new Log();
        var fileStore = new FileStore(directoryInfo);
        var cache = new StoreCache(fileStore, fileStore);
        var log = new StoreLogger(logger, cache, cache);
        return new MessageStore(log, log, fileStore);
    }
}

export class MessageStore {
    private fileLocator: IFileLocator;
    private writer: IStoreWriter;
    private reader: IStoreReader;

    constructor(writer: IStoreWriter,
        reader: IStoreReader,
        fileLocator: IFileLocator) {

        if (writer == null)
            throw new ArgumentNullError("writer");
        if (reader == null)
            throw new ArgumentNullError("reader");
        if (fileLocator == null)
            throw new ArgumentNullError("fileLocator")

        this.fileLocator = fileLocator;
        this.reader = reader;
        this.writer = writer;
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

