/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Countdown extends EventEmitter {
    private minimumDecrements;
    private modelToTracker;
    constructor();
    private topicHandler(model, before, after);
    private resetTracker(tracker, newNumbers);
}
