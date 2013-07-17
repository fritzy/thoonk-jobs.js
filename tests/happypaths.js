var async = require('async');
var config = require('getconfig');
var Thoonk = require('thoonk').Thoonk;
var Job = require('../index');


var thoonk;


var testCase = exports['Job Happy Path Tests'] = {
    setUp: function (cb) {
        thoonk = new Thoonk(config);
        thoonk.redis.flushdb();
    
        thoonk.registerObject('Job', Job, cb);
    },
    tearDown: function (cb) {
        if (thoonk) {
            thoonk.quit();
        }
        cb();
    }
};


testCase['Publish and get job'] = function (test) {
    var jobWorker = thoonk.objects.Job('job1');
    var jobId = null;

    jobWorker.subscribe(function () {
        async.waterfall([
            function (cb) {
                jobWorker.publish('item', {}, cb);
            },
            function (item, id, cb) {
                test.ok(JSON.parse(item) === 'item');
                jobId = id;

                jobWorker.get(0, cb);
            },
            function (claimed, item, id, cb) {
                test.ok(claimed === 1);
                test.ok(id === jobId);

                jobWorker.finish(id, 'result', cb);
            }
        ], function (err) {
            test.ok(!err);
            test.done();
        });
    });
};


testCase['Publish and stall/retry job'] = function (test) {
    var jobWorker = thoonk.objects.Job('job2');
    var jobId = null;

    jobWorker.subscribe(function () {
        async.waterfall([
            function (cb) {
                jobWorker.publish('item', {}, cb);
            },
            function (item, id, cb) {
                test.ok(JSON.parse(item) === 'item');
                jobId = id;

                jobWorker.get(0, cb);
            },
            function (claimed, item, id, cb) {
                test.ok(claimed === 1);
                test.ok(id === jobId);

                jobWorker.stall(id, cb);
            },
            function (id, cb) {
                test.ok(id == jobId);

                jobWorker.retry(id, cb);
            },
            function (id, cb) {
                test.ok(id == jobId);
                jobWorker.get(0, cb);
            },
            function (claimed, item, id, cb) {
                test.ok(claimed === 1);
                test.ok(id === jobId);

                jobWorker.finish(id, 'result', cb);
            }
        ], function (err) {
            test.ok(!err);
            test.done();
        });
    });
};


testCase['Publish and cancel/retract job'] = function (test) {
    var jobWorker = thoonk.objects.Job('job2');
    var jobId = null;

    jobWorker.subscribe(function () {
        async.waterfall([
            function (cb) {
                jobWorker.publish('item', {}, cb);
            },
            function (item, id, cb) {
                test.ok(JSON.parse(item) === 'item');
                jobId = id;

                jobWorker.get(0, cb);
            },
            function (claimed, item, id, cb) {
                test.ok(claimed === 1);
                test.ok(id === jobId);

                jobWorker.cancel(id, cb);
            },
            function (id, cb) {
                test.ok(id == jobId);

                jobWorker.retract(id, cb);
            },
            function (id, cb) {
                test.ok(id == jobId);
                cb();
            }
        ], function (err) {
            test.ok(!err);
            test.done();
        });
    });
};
