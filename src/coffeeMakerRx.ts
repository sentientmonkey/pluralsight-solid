import { WarmerPlateStatus, BoilerStatus, BrewButtonStatus, BoilerState, WarmerState, IndicatorState, ReliefValveState, CoffeeMakerAPI } from "./coffeeMakerAPI";

interface IObserver {
    onNext(eventType: string, value: any): void;
}

enum EventType {
    BoilerStatus = "BoilerStatus",
    BrewButtonStatus = "BrewButtonStatus",
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
        }
    }

    protected onBoilerStatus(value: BoilerStatus): void { };
    protected onBrewButtonStatus(value: BrewButtonStatus): void { };
}

class Boiler extends HardwareObserver {
    private hasWater = false;

    onBoilerStatus(value: BoilerStatus) {
        this.hasWater = value === BoilerStatus.NotEmpty;
        if (!this.hasWater) {
            this.hardware.setBoilerState(BoilerState.Off);
        }
    }

    onBrewButtonStatus(value: BrewButtonStatus) {
        if (this.hasWater && value === BrewButtonStatus.Pushed) {
            this.hardware.setBoilerState(BoilerState.On);
        }
    }
}

export class CoffeeMaker {
    private events: Observable<any>[];

    private boiler: Boiler;

    constructor(hardware: CoffeeMakerAPI) {
        this.events = [];
        var buttonEvents = new Observable<BrewButtonStatus>(
            EventType.BrewButtonStatus,
            hardware.getBrewButtonStatus);
        var boilerEvents = new Observable<BoilerStatus>(
            EventType.BoilerStatus,
            hardware.getBoilerStatus);
        this.events.push(boilerEvents);
        this.events.push(buttonEvents);

        this.boiler = new Boiler(hardware);

        buttonEvents.subscribe(this.boiler);
        boilerEvents.subscribe(this.boiler);
    }
    update(): void {
        this.events.forEach(e => e.notify());
    }
}

