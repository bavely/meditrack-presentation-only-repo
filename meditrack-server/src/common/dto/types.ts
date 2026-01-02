// src/common/dto/types.ts
export type ClassType<T> = new (...args: any[]) => T;
