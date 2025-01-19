import GameObject from "../objects/GameObject.ts";
import Overlap from "./IOverlap.ts";

export default class OverlapOKOK implements Overlap{
    readonly obj1: GameObject;
    readonly obj2: GameObject;

    constructor(obj1: GameObject, obj2: GameObject) {
        if (obj1.boxCollider == null || obj2.boxCollider == null)
            throw new Error("Nie ustawiono box collidera dla obiektów.");
        this.obj1 = obj1;
        this.obj2 = obj2;
    }

    onOverlap(): void {}
    checkOverlap(): boolean {
        return false;
    }
}
