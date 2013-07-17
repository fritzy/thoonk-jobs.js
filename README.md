# Thoonk Jobs

## What is Thoonk?

Thoonk is a persistent (and fast!) framework for Redis backed live data and 
objects, such as push feeds, queues, and jobs.

See https://github.com/fritzy/thoonk.js for more on Thoonk.


## What is this?

Thoonk Jobs are Redis-based job queues with support for claiming, stalling,
retrying, and retracting individual tasks. Jobs are useful for distributing
load, ensuring a task is completed regardless of outages, and keeping long
running tasks away from synchronous interfaces.

    Publish |
          V |     
            |
        +---------+  Stall>    +-------+
        |Available|------------|Stalled|
        +---------+  <Retry    +-------+
            |  | ^
        Get |  | Cancel
          V |  |
          +-------+             +--------+
          |Claimed|-------------|Finished|
          +-------+    Finish>  +--------+

Multiple Thoonk Job instances (aka workers) may share the same job queue, 
allowing multiple tasks to be processed in parallel. 

When a task becomes available in the queue, a worker must claim it to have
sole control over its processing. In the case of multiple workers receiving
the available task notification, the first to claim the task wins. Once
the task is claimed, if there is some recoverable error such as a lack of
required resources, the task must be cancelled to send it back to the queue
for other workers to claim it. The number of times that a task has been
sent back is tracked to facilitate monitoring.

Tasks can also be stalled and moved to a holding area where they will not
be dispatched for workers to claim. Tasks that have been cancelled multiple
times are good candidates for stalling so that the repeated issues can be
investigated before retrying the task.


## Installing

    npm install thoonk-jobs

## Example

```js
var thoonk = require('thoonk').createClient();
var Job = require('thoonk-jobs');

thoonk.registerObject('Job', Job, function () {

    var jobPublisher = thoonk.objects.Job('coolJobChannel');
    jobPublisher.subscribe(function () {

        jobPublisher.publish({whatever: 'you need as json'}, {
            //id: 'customId',
            //priority: true, // push the job to the front of the queue
            onFinish: function () {
                console.log('Job completed!');
            }
        }, function () {
            console.log('Job published');
        });

    });
});
```


```js
var async = require('async');
var thoonk = require('thoonk').createClient();
var Job = require('thoonk-jobs');

thoonk.registerObject('Job', Job, function () {

    var jobWorker = thoonk.objects.Job('coolJobChannel');
    async.forever(function (next) {
        jobWorker.get(0, function (err, item, id) { 
            if (err) return next();

            item = JSON.parse(item);

            //doStuff(item);

            jobWorker.finish(id, 'the results', function (err) {
                next();  
            });
        });
    });
});
```

## Testing

To prevent accidentally clobbering databases, tests are disabled by default. Set 
`"enabled"` to `true` in `test_config.json` to enable them, then run:

    npm test


## License

MIT


## Created By

If you like this, follow [@fritzy](http://twitter.com/fritzy) on twitter.
