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
