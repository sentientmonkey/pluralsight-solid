import "jasmine";
import { MessageStore, DirectoryInfo, Maybe, ArgumentNullError, ArgumentError } from "../src/filestore";
import fs = require('fs');

describe("something", () => {
    var subject: MessageStore;
    var directoryInfo: DirectoryInfo;
    const path = "/tmp";
    const testFile = 42;
    const fullTestFile = "/tmp/42.txt";

    beforeAll(() => {
        directoryInfo = new DirectoryInfo(path);
        subject = new MessageStore(directoryInfo);
        if (fs.existsSync(fullTestFile)) {
            fs.unlinkSync(fullTestFile);
        }
    });

    it("should throw an exception when working directory not set", () => {
        expect(() => {
            subject = new MessageStore(null);
        }).toThrowError(ArgumentNullError);
    });

    it("should throw an exception when working directory does not exist", () => {
        expect(() => {
            directoryInfo = new DirectoryInfo("/does/not/exist");
            subject = new MessageStore(directoryInfo);
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
