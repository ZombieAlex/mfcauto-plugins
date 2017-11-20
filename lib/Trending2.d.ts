import { Model } from "MFCAuto";
export declare type Trending2Callback = (model: Model, duration: number, delta: number) => void;
export declare class Trending2 {
    private trendingCallbacks;
    private offlineTimerMap;
    private maxHistoryMilliseconds;
    private modelToCountHistories;
    constructor(maxHistoryMilliseconds?: number);
    reset(maxHistoryMilliseconds?: number): void;
    shutdown(): void;
    onTrendingThresholds(milliseconds: number, viewerCount: number, callback: Trending2Callback): void;
    private vsHandler(model, before, after);
    private rcHandler(model, before, after);
    getRoomCountAt(model: Model, millisecondsAgo: number): number | undefined;
    private checkModelTrending(model);
    private checkAllModels();
}
