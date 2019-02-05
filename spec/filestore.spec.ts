import "jasmine";
import { FileStore, Maybe } from "../src/filestore";
import fs = require('fs');

describe("something", () => {
    var subject: FileStore;
    const path = "/tmp";
    const testFile = 42;
    const fullTestFile = "/tmp/42.txt";

    beforeAll(() => {
        subject = new FileStore(path);
        if (fs.existsSync(fullTestFile)) {
            fs.unlinkSync(fullTestFile);
        }
    });

    it("should save file", () => {
        const testMessage = "message";
        subject.save(testFile, testMessage);
        expect(subject.read(testFile).value()).toEqual(testMessage);
    });

    it("should handle reading file that doesn't exist", () => {
        expect(subject.read(0).defaultIfEmpty("empty")).toEqual("empty");
    });
});
