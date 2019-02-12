import { WarmerPlateStatus, BoilerStatus, BrewButtonStatus, BoilerState, WarmerState, IndicatorState, ReliefValveState, CoffeeMakerAPI } from "./coffeeMakerAPI";

interface IObserver {
    onNext(value: any): void;
}

class Observable<T> {
    private eventProducer: () => T;
    private observers: IObserver[];

    constructor(eventProducer: () => T) {
        this.eventProducer = eventProducer;
        this.observers = [];
    }

    subscribe(observer: IObserver): void {
        this.observers.push(observer);
    }

    tick(): void {
        var t = this.eventProducer();
        this.observers.forEach(o => o.onNext(t));
    }
}

class Boiler implements IObserver {
    private hardware: CoffeeMakerAPI;
    private hasWater = false;

    constructor(hardware: CoffeeMakerAPI) {
        this.hardware = hardware;
    }

    onNext(value: any): void {
        if (<BoilerStatus>value) {
            this.hasWater = value === BoilerStatus.NotEmpty;
            if (!this.hasWater) {
                this.hardware.setBoilerState(BoilerState.Off);
            }
        }

        if (<BrewButtonStatus>value) {
            if (this.hasWater && value === BrewButtonStatus.Pushed) {
                this.hardware.setBoilerState(BoilerState.On);
            }
        }
    }
}

export class CoffeeMaker {
    constructor(hardware: CoffeeMakerAPI) {
    }

    update(): void {
    }
}

