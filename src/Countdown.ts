/*
Countdown.ts detects countdowns in all rooms by monitoring changes in
the room topics.  It emits one of 4 events in the process:

    "countdownDetected" which is given the Model, amount remaining, and current room topic
    "countdownAbandoned" which is given the Model, the topic before the change that abandoned it, and the topic after abandoning
    "countdownUpdated" which is given the Model, amount remaining, and the current room topic
    "countdownCompleted" which is given the Model, the topic before completing the countdown, and the topic after

Countdown completion detection is done by monitoring all the numbers in a model's
topic and detecting when they are decremented. If Countdown.ts sees that any one
number in the topic is decremented at least Countdown.minimumDecrements times, it
assumes that is the countdown value and emits "countdownDetected".

That's the basic logic, it gets more complex than that depending on how each model's
topic changes.
*/

import {EventEmitter} from "events";
import {Model} from "MFCAuto";

interface TopicTracker {
    hasCountdown: boolean;
    numbers: Array<number>;
    decrementMap: Array<number>;
    index: number;
}

export class Countdown extends EventEmitter {
    private minimumDecrements = 2;
    private modelToTracker: Map<number, TopicTracker>;

    constructor() {
        super();
        this.modelToTracker = new Map() as Map<number, TopicTracker>;
        Model.on("topic", this.topicHandler.bind(this));
    }

    private topicHandler(model: Model, before: string, after: string): void {
        let numberRe = /\d+/g;
        let cleanAfter = (after || "").replace(/\[none\]/g, "0");

        // Convert "[none]" (which MFC's auto-countdown code sometimes inserts to
        // indicate a countdown is completed) to 0 and then create an array of all
        // the numbers in the model's current topic.
        let newNumbers = (cleanAfter.match(numberRe) || []).map(Number);

        // Get the model's current topic tracker state, creating a new one if we
        // don't have a current tracker for this model.
        if (!this.modelToTracker.has(model.uid)) {
            this.modelToTracker.set(model.uid, { hasCountdown: false, index: -1, numbers: [], decrementMap: [] });
        }
        let tracker = this.modelToTracker.get(model.uid);

        if (tracker !== undefined) {
            if (before === undefined || after === undefined) {
                // Model's don't set their own topics to undefined, so don't
                // treat either coming from or going to undefined as reaching
                // a goal.
                if (tracker.hasCountdown) {
                    this.emit("countdownAbandoned", model, before, after);
                }
                this.resetTracker(tracker, newNumbers);
            } else {
                // If the new topic has numbers and the same number of numbers
                // as the old topic, then we can proceed to update our decrementMap
                let oldNumbers = tracker.numbers;
                if (newNumbers.length === oldNumbers.length && newNumbers.length > 0) {
                    for (let i = 0; i < newNumbers.length; i++) {
                        if (oldNumbers[i] > newNumbers[i]) {
                            tracker.decrementMap[i]++;
                            if (tracker.decrementMap[i] >= this.minimumDecrements) {
                                if (tracker.hasCountdown) {
                                    if (tracker.index !== i) {
                                        // Two different numbers in the model's topic have been
                                        // decremented more than minimumDecrements times, no longer
                                        // sure what's what...
                                        this.emit("countdownAbandoned", model, before, after);
                                        this.resetTracker(tracker, newNumbers);
                                    } else {
                                        if (newNumbers[i] === 0) {
                                            this.emit("countdownCompleted", model, before, after);
                                            this.resetTracker(tracker, newNumbers);
                                        } else {
                                            this.emit("countdownUpdated", model, newNumbers[i], after);
                                        }
                                    }
                                } else {
                                    tracker.hasCountdown = true;
                                    tracker.index = i;
                                    this.emit("countdownDetected", model, newNumbers[i], after);

                                    if (newNumbers[i] === 0) {
                                        this.emit("countdownCompleted", model, before, after);
                                        this.resetTracker(tracker, newNumbers);
                                    }
                                }
                            }
                        }
                    }
                    tracker.numbers = newNumbers;
                } else {
                    // The model changed the number of numbers in her topic
                    if (tracker.hasCountdown) {
                        // If we thought there was a countdown going prior to this topic change,
                        // and the amount of the countdown is still in the model's topic somewhere,
                        // then just update our countdown index and decrementMap
                        let newIndex = newNumbers.indexOf(oldNumbers[tracker.index]);
                        if (newIndex !== -1 && newNumbers.lastIndexOf(oldNumbers[tracker.index]) === newIndex) {
                            let previousDecrementCount = tracker.decrementMap[tracker.index];
                            tracker.decrementMap = newNumbers.map(() => 0);
                            tracker.decrementMap[newIndex] = previousDecrementCount;
                            tracker.index = newIndex;
                            tracker.numbers = newNumbers;
                        } else {
                            // Otherwise, we're not really sure if a countdown was completed
                            // but maybe?  Err on the safe side and fire the countdownCompleted
                            // event.  Better to have a few false positives than miss a countdown.
                            this.emit("countdownCompleted", model, before, after);
                            this.resetTracker(tracker, newNumbers);
                        }
                    } else {
                        this.resetTracker(tracker, newNumbers);
                    }
                }
            }
        }
    }

    private resetTracker(tracker: TopicTracker, newNumbers: Array<number>) {
        tracker.hasCountdown = false;
        tracker.numbers = newNumbers;
        tracker.index = -1;
        tracker.decrementMap = newNumbers.map(() => 0);
    }
}

