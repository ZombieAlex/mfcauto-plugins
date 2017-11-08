# mfcauto-plugins
A collection of utility classes that work with [MFCAuto](https://github.com/ZombieAlex/MFCAuto).  These are all [NodeJS EventEmitters](https://nodejs.org/api/events.html#events_class_eventemitter) that simplify monitoring and interacting with MFC in complex ways.

Useful contributions are very welcome.  How are you using MFCAuto?

## Setup
```bash
# Install MFCAuto
$ npm install ZombieAlex/MFCAuto --save

# Install mfcauto-plugins
$ npm install ZombieAlex/mfcauto-plugins --save
```

## Classes & Examples

### Countdown
Monitors topic changes for all online models and detects when a model starts or completes a countdown goal, then emits events with those details.

This code will continually monitor print the state of all active countdowns across the entire site forever:
```javascript
let mfc = require("MFCAuto");
let client = new mfc.Client();

let Countdown = require("mfcauto-plugins").Countdown;
let cd = new Countdown();

cd.on("countdownDetected", (model, tokensRemaining, topic) => {
    console.log(`${(new Date()).toISOString()} - ${model.nm} started a countdown, ${tokensRemaining} remaining. \n\tTopic: ${topic}\n`);
});
cd.on("countdownUpdated", (model, tokensRemaining, topic) => {
    console.log(`${(new Date()).toISOString()} - ${model.nm}'s countdown has updated, ${tokensRemaining} remaining. \n\tTopic: ${topic}\n`);
});
cd.on("countdownAbandoned", (model, topicBefore, topicAfter) => {
    console.log(`${(new Date()).toISOString()} - ${model.nm}'s topic changed such that we are no longer tracking a countdown. \n\tTopic was: ${topicBefore} \n\tNow: ${topicAfter}\n`);
});
cd.on("countdownCompleted", (model, topicBefore, topicAfter) => {
    console.log(`${(new Date()).toISOString()} - ${model.nm} completed her countdown! \n\tTopic was: ${topicBefore} \n\tNow: ${topicAfter}\n`);
});

client.connect();
```

### Trending
Monitors room counts and detects when any model gains X viewers in Y milliseconds, where X and Y are configurable via constructor parameters. MFC's own trending page tracks tending over 1 minute and over 5 minutes. You can accomplish the same thing with two Trending instances.
```javascript
let mfc = require("MFCAuto");
let client = new mfc.Client();

let Trending = require("mfcauto-plugins").Trending;
let trending = new Trending(50, 60 * 1000);

trending.on("trendingModel", (model, delta) => {
    // delta will be >= 50, the threshold specified in the constructor
    console.log(`${model.nm} has gained ${delta} viewers over the last 60 seconds`);
});

client.connect();
```
