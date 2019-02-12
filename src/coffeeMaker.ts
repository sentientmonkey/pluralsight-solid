
export enum WarmerPlateStatus {
    WarmerEmpty,
    PotEmpty,
    PotNotEmpty,
}

export enum BoilerStatus {
    Empty,
    NotEmpty,
}

export enum BrewButtonStatus {
    Pushed,
    NotPushed,
}

export enum BoilerState {
    On,
    Off,
}

export enum WarmerState {
    On,
    Off,
}

export enum IndicatorState {
    On,
    Off,
}

export enum ReliefValveState {
    Open,
    Closed,
}

export interface CoffeeMakerAPI {
    /*
     * This function returns the status of the warmer-plate
     * sensor. This sensor detects the presence of the pot
     * and whether it has coffee in it.
     */
    getWarmerPlateStatus(): WarmerPlateStatus;
    /*
     * This function returns the status of the boiler switch.
     * The boiler switch is a float switch that detects if
     * there is more than 1/2 cup of water in the boiler.
     */
    getBoilerStatus(): BoilerStatus;
    /*
     * This function returns the status of the brew button.
     * The brew button is a momentary switch that remembers
     * its state. Each call to this function returns the
     * remembered state and then resets that state to
     * NOT_PUSHED.
     *
     * Thus, even if this function is polled at a very slow
     * rate, it will still detect when the brew button is
     * pushed.
     */
    getBrewButtonStatus(): BrewButtonStatus;
    /*
     * This function turns the heating element in the boiler
     * on or off.
     */
    setBoilerState(s: BoilerState): void;
    /*
     * This function turns the heating element in the warmer
     * plate on or off.
     */
    setWarmerState(s: WarmerState): void;
    /*
     * This function turns the indicator light on or off.
     * The indicator light should be turned on at the end
     * of the brewing cycle. It should be turned off when
     * the user presses the brew button.
     */
    setIndicicatorState(s: IndicatorState): void;
    /*
     * This function opens and closes the pressure-relief
     * valve. When this valve is closed, steam pressure in
     * the boiler will force hot water to spray out over
     * the coffee filter. When the valve is open, the steam
     * in the boiler escapes into the environment, and the
     * water in the boiler will not spray out over the filter.
     */
    setReliefValveState(s: ReliefValveState): void;
}

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
            this.startBrewing();
        }

        if (this.brewing) {
            if (this.potRemoved()) {
                this.pauseBrewing();
            } else {
                this.resumeBrewing();
            }
        }

        if (this.boilerIsEmpty()) {
            this.finishBrewing();
        }
    }

    private startBrewing() {
        this.hardware.setBoilerState(BoilerState.On);
        this.brewing = true;
    }

    private pauseBrewing() {
        this.hardware.setReliefValveState(ReliefValveState.Open);
    }

    private resumeBrewing() {
        this.hardware.setReliefValveState(ReliefValveState.Closed);
    }

    private finishBrewing() {
        this.hardware.setBoilerState(BoilerState.Off);
        this.eventBus.push(EventType.CoffeeBrewed);
        this.brewing = false;
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

    private potRemoved(): boolean {
        return this.hardware.getWarmerPlateStatus()
            === WarmerPlateStatus.WarmerEmpty;
    }
}

export enum EventType {
    CoffeeBrewed = "CoffeeBrewed",
}


export class Light extends HardwareComponent {
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
    private eventBus: EventBus;

    constructor(hardware: CoffeeMakerAPI) {
        this.eventBus = new EventBus();
        this.warmerPlate = new WarmerPlate(hardware, this.eventBus);
        this.boiler = new Boiler(hardware, this.eventBus);
        this.light = new Light(hardware, this.eventBus);
    }

    update(): void {
        this.boiler.update();
        this.warmerPlate.update();
        this.light.update();
        this.eventBus.clear();
    }
}
