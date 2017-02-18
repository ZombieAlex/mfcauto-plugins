"use strict";
var events_1 = require("events");
var MFCAuto_1 = require("MFCAuto");
var Countdown = (function () {
    function Countdown() {
        this.minimumDecrements = 2;
        this.modelToTracker = new Map();
        MFCAuto_1.Model.on("topic", this.topicHandler.bind(this));
    }
    Countdown.prototype.topicHandler = function (model, before, after) {
        var numberRe = /\d+/g;
        var cleanAfter = (after || "").replace(/\[none\]/g, "0");
        var newNumbers = (cleanAfter.match(numberRe) || []).map(Number);
        if (!this.modelToTracker.has(model.uid)) {
            this.modelToTracker.set(model.uid, { hasCountdown: false, index: -1, numbers: [], decrementMap: [] });
        }
        var tracker = this.modelToTracker.get(model.uid);
        if (before === undefined || after === undefined) {
            if (tracker.hasCountdown) {
                this.emit("countdownAbandoned", model, before, after);
            }
            this.resetTracker(tracker, newNumbers);
        }
        else {
            var oldNumbers = tracker.numbers;
            if (newNumbers.length === oldNumbers.length && newNumbers.length > 0) {
                for (var i = 0; i < newNumbers.length; i++) {
                    if (oldNumbers[i] > newNumbers[i]) {
                        tracker.decrementMap[i]++;
                        if (tracker.decrementMap[i] >= this.minimumDecrements) {
                            if (tracker.hasCountdown) {
                                if (tracker.index !== i) {
                                    this.emit("countdownAbandoned", model, before, after);
                                    this.resetTracker(tracker, newNumbers);
                                }
                                else {
                                    if (newNumbers[i] === 0) {
                                        this.emit("countdownCompleted", model, before, after);
                                        this.resetTracker(tracker, newNumbers);
                                    }
                                    else {
                                        this.emit("countdownUpdated", model, newNumbers[i], after);
                                    }
                                }
                            }
                            else {
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
            }
            else {
                if (tracker.hasCountdown) {
                    var newIndex = newNumbers.indexOf(oldNumbers[tracker.index]);
                    if (newIndex !== -1 && newNumbers.lastIndexOf(oldNumbers[tracker.index]) === newIndex) {
                        var previousDecrementCount = tracker.decrementMap[tracker.index];
                        tracker.decrementMap = newNumbers.map(function () { return 0; });
                        tracker.decrementMap[newIndex] = previousDecrementCount;
                        tracker.index = newIndex;
                        tracker.numbers = newNumbers;
                    }
                    else {
                        this.emit("countdownCompleted", model, before, after);
                        this.resetTracker(tracker, newNumbers);
                    }
                }
                else {
                    this.resetTracker(tracker, newNumbers);
                }
            }
        }
    };
    Countdown.prototype.resetTracker = function (tracker, newNumbers) {
        tracker.hasCountdown = false;
        tracker.numbers = newNumbers;
        tracker.index = -1;
        tracker.decrementMap = newNumbers.map(function () { return 0; });
    };
    return Countdown;
}());
exports.Countdown = Countdown;
MFCAuto_1.applyMixins(Countdown, [events_1.EventEmitter]);
//# sourceMappingURL=Countdown.js.map