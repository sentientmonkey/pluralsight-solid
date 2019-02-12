import { WarmerPlateStatus, BoilerStatus, BrewButtonStatus, BoilerState, WarmerState, IndicatorState, ReliefValveState, CoffeeMakerAPI } from "./coffeeMakerAPI";

abstract class HardwareComponent {
    protected hardware: CoffeeMakerAPI;
    protected eventBus: EventBus;

    constructor(hardware: CoffeeMakerAPI, eventBus: EventBus) {
        this.hardware = hardware;
        this.eventBus = eventBus;
    }

    public potEmpty(): boolean {
        return this.hardware.getWarmerPlateStatus()
            === WarmerPlateStatus.PotEmpty;
    }
}

class WarmerPlate extends HardwareComponent {
    public update(): void {
        if (this.potNotEmpty()) {
            this.hardware.setWarmerState(WarmerState.On);
        } else {
            this.hardware.setWarmerState(WarmerState.Off);
        }
    }

    private potNotEmpty(): boolean {
        return this.hardware.getWarmerPlateStatus()
            === WarmerPlateStatus.PotNotEmpty;
    }
}

class Boiler extends HardwareComponent {
    private brewing = false;

    public update(): void {
        if (this.readyToBrew()) {
            this.hardware.setBoilerState(BoilerState.On);
            this.brewing = true
        }

        if (this.boilerIsEmpty()) {
            this.hardware.setBoilerState(BoilerState.Off);
            this.eventBus.push(EventType.CoffeeBrewed);
            this.brewing = false;
        }
    }

    private readyToBrew(): boolean {
        return this.brewButtonPushed()
            && this.potEmpty()
            && this.boilerHasWater();
    }

    public boilerIsEmpty(): boolean {
        return this.hardware.getBoilerStatus()
            === BoilerStatus.Empty;
    }

    public boilerHasWater(): boolean {
        return this.hardware.getBoilerStatus()
            === BoilerStatus.NotEmpty;
    }

    private brewButtonPushed(): boolean {
        return this.hardware.getBrewButtonStatus()
            === BrewButtonStatus.Pushed;
    }
}

class ReliefValve extends HardwareComponent {
    private brewing = false;

    public update(): void {
        if (this.brewButtonPushed()) {
            this.brewing = true;
        }

        if (this.brewing) {
            if (this.potRemoved()) {
                this.hardware.setReliefValveState(ReliefValveState.Open);
            } else {
                this.hardware.setReliefValveState(ReliefValveState.Closed);
            }
        }

        if (this.boilerIsEmpty()) {
            this.brewing = false;
        }
    }

    public boilerIsEmpty(): boolean {
        return this.hardware.getBoilerStatus()
            === BoilerStatus.Empty;
    }

    private brewButtonPushed(): boolean {
        return this.hardware.getBrewButtonStatus()
            === BrewButtonStatus.Pushed;
    }

    private potRemoved(): boolean {
        return this.hardware.getWarmerPlateStatus()
            === WarmerPlateStatus.WarmerEmpty;
    }
}

enum EventType {
    CoffeeBrewed = "CoffeeBrewed",
}


class Light extends HardwareComponent {
    private freshPot = false;

    public update(): void {
        if (this.eventBus.includes(EventType.CoffeeBrewed)) {
            this.hardware.setIndicicatorState(IndicatorState.On);
            this.freshPot = true;
        }

        if (this.freshPot && this.hardware.getWarmerPlateStatus() == WarmerPlateStatus.WarmerEmpty) {
            this.hardware.setIndicicatorState(IndicatorState.Off);
            this.freshPot = false;
        }
    }
}

class EventBus {
    private events: EventType[];

    constructor() {
        this.events = [];
    }

    push(event: EventType): void {
        this.events.push(event);
    }

    includes(event: EventType): boolean {
        return this.events.includes(event);
    }

    clear() {
        this.events.length = 0;
    }
}

export class CoffeeMaker {
    private warmerPlate: WarmerPlate;
    private boiler: Boiler;
    private light: Light;
    private reliefValve: ReliefValve;
    private eventBus: EventBus;

    constructor(hardware: CoffeeMakerAPI) {
        this.eventBus = new EventBus();
        this.warmerPlate = new WarmerPlate(hardware, this.eventBus);
        this.boiler = new Boiler(hardware, this.eventBus);
        this.light = new Light(hardware, this.eventBus);
        this.reliefValve = new ReliefValve(hardware, this.eventBus);
    }

    update(): void {
        this.boiler.update();
        this.warmerPlate.update();
        this.light.update();
        this.reliefValve.update();
        this.eventBus.clear();
    }
}
