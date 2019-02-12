import "jasmine";

import { WarmerPlateStatus, BoilerStatus, BrewButtonStatus, BoilerState, WarmerState, IndicatorState, ReliefValveState, CoffeeMakerAPI } from "../src/coffeeMakerAPI";

import { CoffeeMaker } from "../src/coffeeMakerRx";

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
                "setWarmerState",
                "setIndicicatorState",
                "setReliefValveState",
            ]
        );
        subject = new CoffeeMaker(api);
    });

    it("will not turn on boiler when nothing pressed", () => {
        subject.update();
        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.Off);
    });

    it("will brew when button pressed", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);
        api.getBoilerStatus.and.returnValue(BoilerStatus.NotEmpty);

        subject.update();
        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.On);
    });

    it("will not brew when the warmer is empty", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.WarmerEmpty);

        subject.update();
        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.Off);
    });

    it("will not brew when the pot is full", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotNotEmpty);

        subject.update();

        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.Off);
    });

    it("will not brew when the boiler is empty", () => {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);

        subject.update();

        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.Off);
    });

    it("will stop boiling when water is empty", () => {
        api.getBoilerStatus.and.returnValue(BoilerStatus.Empty);
        subject.update();

        expect(api.setBoilerState).toHaveBeenCalledWith(BoilerState.Off);
    });

    it("will keep coffee warm when coffeepot has cofee", () => {
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotNotEmpty);
        subject.update();

        expect(api.setWarmerState).toHaveBeenCalledWith(WarmerState.On);
    });

    it("will shut off warmer when pot is empty", () => {
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);
        subject.update();
        expect(api.setWarmerState).toHaveBeenCalledWith(WarmerState.Off);
    });

    it("will shut off warmer when pot is removed", () => {
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.WarmerEmpty);
        subject.update();
        expect(api.setWarmerState).toHaveBeenCalledWith(WarmerState.Off);
    });

    function startBrew() {
        api.getBrewButtonStatus.and.returnValue(BrewButtonStatus.Pushed);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);
        api.getBoilerStatus.and.returnValue(BoilerStatus.NotEmpty);

        subject.update();
    }

    function finishBrew() {
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotNotEmpty);
        api.getBoilerStatus.and.returnValue(BoilerStatus.Empty);

        subject.update();
    }

    function brewCycle() {
        startBrew();
        finishBrew();
    }

    xit("will turn on the indicator light when the coffee is done brewing", () => {

        brewCycle();
        expect(api.setIndicicatorState).toHaveBeenCalledWith(IndicatorState.On);
    });

    xit("will turn off the indicator light when the brewed coffee is removed from warmer", () => {
        brewCycle();
        expect(api.setIndicicatorState).toHaveBeenCalledWith(IndicatorState.On);

        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.WarmerEmpty);
        subject.update();
        expect(api.setIndicicatorState).toHaveBeenCalledWith(IndicatorState.Off);
    });


    function removePot() {
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.WarmerEmpty);
        subject.update();
    }

    xit("will interrupt brewing if coffee pot is removed", () => {
        startBrew();
        removePot();
        expect(api.setReliefValveState).toHaveBeenCalledWith(ReliefValveState.Open);
        api.getWarmerPlateStatus.and.returnValue(WarmerPlateStatus.PotEmpty);
        subject.update();
        expect(api.setReliefValveState).toHaveBeenCalledWith(ReliefValveState.Closed);
    });
});

