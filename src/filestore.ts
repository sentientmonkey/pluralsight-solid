import fs = require('fs');
import path = require('path');

export class Maybe<T> {
    private values: T[];

    constructor(value?: T) {
        if (value) {
            this.values = [value];
        } else {
            this.values = [];
        }
    }

    defaultIfEmpty(defaultValue: T): T {
        if (this.isEmpty()) {
            return defaultValue;
        } else {
            return this.value();
        }
    }

    isEmpty(): boolean {
        return this.values.length == 0;
    }

    value(): T {
        return this.values[0];
    }
}

export class FileStore {
    workingDirectory: string;

    constructor(workingDirectory: string) {
        this.workingDirectory = workingDirectory;
    }

    save(id: number, message: string): void {
        var path = this.getFilename(id);
        fs.writeFileSync(path, message);
    }

    read(id: number): Maybe<string> {
        var path = this.getFilename(id);
        if (!fs.existsSync(path)) {
            return new Maybe();
        }
        return new Maybe(fs.readFileSync(path).toString());
    }

    getFilename(id: number): string {
        return path.join(this.workingDirectory, id + ".txt");
    }
}
