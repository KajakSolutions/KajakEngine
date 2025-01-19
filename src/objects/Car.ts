import CarBodyObject, {CarBodyObjectOptions} from "./CarBodyObject.ts";

export default class Car {
    public body: CarBodyObject;
    constructor(bodyConfig: CarBodyObjectOptions) {
        this.body = new CarBodyObject(bodyConfig);
        // jakis collider/overlap bym tutaj zrobil
    }

    public update(): void {
        this.body.update();
        // jakis update collider/overlap
    }
}
