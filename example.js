var async = require('async');
var thoonk = require('thoonk').createClient();
var Job = require('./index');


thoonk.registerObject('Job', Job, function () {

    // A Thoonk job worker
    var worker = thoonk.objects.Job('exampleJobChannel');
    async.forever(function (next) {
        // Use 0 to block indefinitely for an available task,
        // or a positive value as number of seconds to wait
        worker.get(0, function (err, item, id) {
            if (err) return next(); // E.g. another worker beat us to claiming the task

            item = JSON.parse(item);

            console.log('Processing ' + id + ': ' + item.foo);

            worker.finish(id, 'Result ' + id + ': ' + item.foo, function (err) {
                next();
            });
        });
    });


    // The job publishing side of things
    var publisher = thoonk.objects.Job('exampleJobChannel');
    // Setup subscriptions for task finished events
    publisher.subscribe(function () {
        var tasks = [
            {foo: 1},
            {foo: 2},
            {foo: 3},
            {foo: 4},
            {foo: 5},
        ];

        var completed = 0;

        async.each(tasks, function (task) {
            publisher.publish(task, {
                // Set to true to bump a task to the front of the queue
                priority: false, 
                // Optionally add a finished event handler
                onFinish: function (err, id, result) {
                    console.log('Finished: ' + result);
                    completed++;
                    if (completed >= tasks.length) {
                        process.exit();
                    }
                }
            }, function (err, item, id) {
                console.log('Published task: ' + id);
            });
        });
    });
});
