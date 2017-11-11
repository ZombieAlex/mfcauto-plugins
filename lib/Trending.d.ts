/// <reference types="node" />
export declare class Trending implements NodeJS.EventEmitter {
    private modelToRoomCounts;
    trendingThreshold: number;
    private intervalTimer;
    addListener: (event: string, listener: Function) => this;
    on: (event: string, listener: Function) => this;
    once: (event: string, listener: Function) => this;
    prependListener: (event: string, listener: Function) => this;
    prependOnceListener: (event: string, listener: Function) => this;
    removeListener: (event: string, listener: Function) => this;
    removeAllListeners: (event?: string) => this;
    getMaxListeners: () => number;
    setMaxListeners: (n: number) => this;
    listeners: (event: string) => Function[];
    emit: (event: string, ...args: any[]) => boolean;
    eventNames: () => string[];
    listenerCount: (type: string) => number;
    constructor(trendingThreshold?: number, checkInterval?: number);
    shutdown(): void;
    private modelUpdateCallback();
}
