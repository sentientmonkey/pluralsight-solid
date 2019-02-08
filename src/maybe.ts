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
        if (this.any()) {
            return this.value();
        } else {
            return defaultValue;
        }
    }

    any(): boolean {
        return this.values.length !== 0;
    }

    value(): T {
        return this.values[0];
    }
}
