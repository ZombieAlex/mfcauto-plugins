/// <reference types="node" />
export declare class Countdown extends NodeJS.EventEmitter {
    private minimumDecrements;
    private modelToTracker;
    constructor();
    private topicHandler(model, before, after);
    private resetTracker(tracker, newNumbers);
}
