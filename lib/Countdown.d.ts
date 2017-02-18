/// <reference types="node" />
export declare class Countdown implements NodeJS.EventEmitter {
    private minimumDecrements;
    private modelToTracker;
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
    constructor();
    private topicHandler(model, before, after);
    private resetTracker(tracker, newNumbers);
}
