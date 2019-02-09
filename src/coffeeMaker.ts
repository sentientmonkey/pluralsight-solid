
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

    constructor(hardware: CoffeeMakerAPI) {
        this.hardware = hardware;
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
    public update(): void {
        if (this.readyToBrew()) {
            this.hardware.setBoilerState(BoilerState.On);
        }
        if (this.boilerIsEmpty()) {
            this.hardware.setBoilerState(BoilerState.Off);
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

export class CoffeeMaker {
    private hardware: CoffeeMakerAPI;
    private warmerPlate: WarmerPlate;
    private boiler: Boiler;

    constructor(hardware: CoffeeMakerAPI) {
        this.hardware = hardware;
        this.warmerPlate = new WarmerPlate(hardware);
        this.boiler = new Boiler(hardware);
    }

    update(): void {
        this.boiler.update();
        this.warmerPlate.update();
    }
}
