import "jasmine";

import { CoffeeMakerAPI, CoffeeMaker, BoilerStatus, BrewButtonStatus, BoilerState, WarmerPlateStatus, IndicatorState } from "../src/coffeeMaker";

describe("CoffeeMaker", () => {
    var api: jasmine.SpyObj<CoffeeMakerAPI>;
    var subject: CoffeeMaker;

    beforeEach(() => {
        api = jasmine.createSpyObj<CoffeeMakerAPI>(
            "coffeeMakerAPI",
            [
                "getWarmerPlateStatus",
                "getBoilerStatus",
                "getBrewButtonStatus",
                "setBoilerState",
            ]
        );
        subject = new CoffeeMaker(api);
    });

    it("will not turn on boiler when nothing pressed", () => {
        subject.tick();
        expect(api.setBoilerState).toHaveBeenCalledTimes(0);
    });

    it("will brew when button pressed", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);

        subject.tick();
        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.On);
    });

    it("will not brew when the warmer is empty", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.WarmerEmpty);

        subject.tick();

        expect(api.setBoilerState).toHaveBeenCalledTimes(0);
    });

    it("will not brew when the pot is full", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotNotEmpty);

        subject.tick();

        expect(api.setBoilerState).toHaveBeenCalledTimes(0);
    });
});
