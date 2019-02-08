import "jasmine";
import { MessageStore, DirectoryInfo, Maybe, ArgumentNullError, ArgumentError, Log, FileStore, StoreCache, StoreLogger, FileMessageStoreFactory } from "../src/filestore";
import fs = require('fs');

describe("something", () => {
    var subject: MessageStore;
    var directoryInfo: DirectoryInfo;
    const path = "/tmp";
    const testFile = 42;
    const fullTestFile = "/tmp/42.txt";

    beforeAll(() => {
        subject = FileMessageStoreFactory.build(path);
        if (fs.existsSync(fullTestFile)) {
            fs.unlinkSync(fullTestFile);
        }
    });

    it("should throw an exception when working directory does not exist", () => {
        expect(() => {
            subject = FileMessageStoreFactory.build("/does/not/exist");
        }).toThrowError(ArgumentError);
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
