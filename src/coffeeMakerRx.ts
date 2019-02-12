import { WarmerPlateStatus, BoilerStatus, BrewButtonStatus, BoilerState, WarmerState, IndicatorState, ReliefValveState, CoffeeMakerAPI } from "./coffeeMakerAPI";
interface IObserver {
    // we can't IObserver<T> here because javascript method collision :(
    onNext(eventType: string, value: any): void;
}

enum EventType {
    BoilerStatus = "BoilerStatus",
    BrewButtonStatus = "BrewButtonStatus",
    WarmerPlateStatus = "WarmerPlateStatus",
}

class Observable<T> {
    private eventType: EventType;
    private eventProducer: () => T;
    private observers: IObserver[];

    constructor(eventType: EventType, eventProducer: () => T) {
        this.eventType = eventType;
        this.eventProducer = eventProducer;
        this.observers = [];
    }

    subscribe(observer: IObserver): void {
        this.observers.push(observer);
    }

    notify(): void {
        var t = this.eventProducer();
        this.observers.forEach(o => o.onNext(this.eventType, t));
    }
}

abstract class HardwareObserver implements IObserver {
    protected hardware: CoffeeMakerAPI;

    constructor(hardware: CoffeeMakerAPI) {
        this.hardware = hardware;
    }

    onNext(eventType: EventType, value: any): void {
        switch (eventType) {
            case EventType.BoilerStatus:
                this.onBoilerStatus(value);
                break;
            case EventType.BrewButtonStatus:
                this.onBrewButtonStatus(value);
                break;
            case EventType.WarmerPlateStatus:
                this.onWarmerPlateStatus(value);
                break;
        }
    }

    protected onBoilerStatus(value: BoilerStatus): void { };
    protected onBrewButtonStatus(value: BrewButtonStatus): void { };
    protected onWarmerPlateStatus(value: WarmerPlateStatus): void { };
}

class Boiler extends HardwareObserver {
    private hasWater = false;
    private hasEmptyPot = false;

    onBoilerStatus(value: BoilerStatus) {
        this.hasWater = value === BoilerStatus.NotEmpty;
        if (!this.hasWater) {
            this.hardware.setBoilerState(BoilerState.Off);
        }
    }

    onBrewButtonStatus(value: BrewButtonStatus) {
        if (this.hasWater
            && this.hasEmptyPot
            && value === BrewButtonStatus.Pushed) {
            this.hardware.setBoilerState(BoilerState.On);
        }
    }

    onWarmerPlateStatus(value: WarmerPlateStatus) {
        this.hasEmptyPot = value === WarmerPlateStatus.PotEmpty;
    }
}

class Warmer extends HardwareObserver {
    onWarmerPlateStatus(value: WarmerPlateStatus) {
        switch (value) {
            case WarmerPlateStatus.PotNotEmpty:
                this.hardware.setWarmerState(WarmerState.On);
                break;
            case WarmerPlateStatus.PotEmpty:
            case WarmerPlateStatus.WarmerEmpty:
                this.hardware.setWarmerState(WarmerState.Off);
                break;
        }
    }
}

class Indicator extends HardwareObserver {
    private hasWater = false;
    private isBrewing = false;

    onBoilerStatus(value: BoilerStatus) {
        this.hasWater = value === BoilerStatus.NotEmpty;
        if (this.isBrewing && value === BoilerStatus.Empty) {
            this.hardware.setIndicicatorState(IndicatorState.On);
            this.isBrewing = false;
        }
    }

    onBrewButtonStatus(value: BrewButtonStatus) {
        if (this.hasWater && value === BrewButtonStatus.Pushed) {
            this.hardware.setIndicicatorState(IndicatorState.Off);
            this.isBrewing = true;
        }
    }
}

class ReliefValve extends HardwareObserver {
    onWarmerPlateStatus(value: WarmerPlateStatus) {
        if (value === WarmerPlateStatus.PotEmpty) {
            this.hardware.setReliefValveState(ReliefValveState.Open);
        } else {
            this.hardware.setReliefValveState(ReliefValveState.Closed);
        }
    }
}

export class CoffeeMaker {
    private events: Observable<any>[];

    constructor(hardware: CoffeeMakerAPI) {
        this.events = [];
        var buttonEvents = new Observable<BrewButtonStatus>(
            EventType.BrewButtonStatus,
            hardware.getBrewButtonStatus);
        var boilerEvents = new Observable<BoilerStatus>(
            EventType.BoilerStatus,
            hardware.getBoilerStatus);
        var warmerPlateEvents = new Observable<WarmerPlateStatus>(
            EventType.WarmerPlateStatus,
            hardware.getWarmerPlateStatus);

        this.events.push(boilerEvents);
        this.events.push(warmerPlateEvents);
        this.events.push(buttonEvents);

        var boiler = new Boiler(hardware);
        buttonEvents.subscribe(boiler);
        warmerPlateEvents.subscribe(boiler);
        boilerEvents.subscribe(boiler);

        var warmer = new Warmer(hardware);
        warmerPlateEvents.subscribe(warmer);

        var indicator = new Indicator(hardware);
        boilerEvents.subscribe(indicator);
        buttonEvents.subscribe(indicator);

        var reliefValve = new ReliefValve(hardware);
        warmerPlateEvents.subscribe(reliefValve);
    }

    update(): void {
        this.events.forEach(e => e.notify());
    }
}

