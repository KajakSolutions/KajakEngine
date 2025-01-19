import {Vec2D} from "../types/math";

export const vec2D = (x: number, y: number) : Vec2D => {
    return { x, y };
}

export const add = (vec1: Vec2D, vec2: Vec2D) : Vec2D => {
    return { x: vec1.x + vec2.x, y: vec1.y + vec2.y };
}

export const subtract = (vec1: Vec2D, vec2: Vec2D) : Vec2D => {
    return { x: vec1.x - vec2.x, y: vec1.y - vec2.y };
}

export const multiply = (vec: Vec2D, num: number) : Vec2D => {
    return { x: vec.x * num, y: vec.y * num };
}

export const divide = (vec: Vec2D, num: number) : Vec2D => {
    if (num === 0) {
        throw Error("You can't divide by zero!");
    }
    return { x: vec.x / num, y: vec.y / num };
}

export const length = (vec: Vec2D) : number => {
    return Math.sqrt(vec.x ** 2 + vec.y ** 2);
}

export const squaredLength = (vec: Vec2D) : number => {
    return vec.x ** 2 + vec.y ** 2;
}

export const normalize = (vec: Vec2D) : Vec2D => {
    const l = length(vec);
    return divide(vec, l);
}

export const dotProduct = (vec1: Vec2D, vec2: Vec2D) : number => {
    return vec1.x * vec2.x + vec1.y * vec2.y;
}
