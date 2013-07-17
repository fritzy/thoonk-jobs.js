var uuid = require('node-uuid');
var ThoonkObject = require('thoonk').ThoonkBaseObject;


function Job(name, thoonk) {
    ThoonkObject.call(this, name, thoonk);

    this.bredis = this.thoonk._getBlockingRedis(name);
    this.lredis = this.thoonk.lredis;
    this.redis = this.thoonk.redis;

    this.subscribables = [
        'publish',
        'retract',
        'finish',
        'retry',
        'stall'
    ];
}

Job.prototype = Object.create(ThoonkObject.prototype);
Job.prototype.constructor = Job;
Job.prototype.objtype = 'job';
Job.prototype.scriptdir = __dirname + '/scripts';

(function () {

    this.publish = function (item, opts, cb) {
        var jobId = opts.id || uuid();
        var args = [jobId, JSON.stringify(item), '' + Date.now()];
        if (opts.priority) {
            args.push(opts.priority);
        }
        if (opts.onFinish) {
            this.once('job.id.finish:' + jobId, opts.onFinish);
        }
        this.runScript('publish', args, cb);
    };

    this.put = this.publish;

    this.get = function (timeout, cb) {
        var self = this;
        this.bredis.brpop('job.ids:' + this.name, timeout || 0, function (err, args) {
            if (args && args[1]) {
                self.runScript('get', [args[1], '' + Date.now()], cb);
            } else {
                cb('Timeout');
            }
        });
    };

    this.finish = function (jobId, result, cb) {
        var args = [jobId];
        if (result) {
            args.push(result);
        }
        this.runScript('finish', args, cb);
    };

    this.cancel = function (jobId, cb) {
        this.runScript('cancel', [jobId], cb);
    };

    this.stall = function (jobId, cb) {
        this.runScript('stall', [jobId], cb);
    };

    this.retry = function (jobId, cb) {
        this.runScript('retry', [jobId, '' + Date.now()], cb);
    };

    this.retract = function (jobId, cb) {
        this.runScript('retract', [jobId], cb);
    };

    this.getFailureCount = function (jobId, cb) {
        this.redis.hget('job.cancelled:' + this.name, jobId, cb);
    };

    this.handleEvent = function (channel, msg) {
        var objSplit = channel.split(':');
        var typeSplit = objSplit[0].split('.');
        var eventName = typeSplit[2];
        if (~['publish', 'finish'].indexOf(eventName)) {
            var msgSplit = msg.split('\x00');
            this.emit('job.id.' + eventName + ':' + msgSplit[0], null, msgSplit[0], msgSplit[1] || null);
        }
    };

}).call(Job.prototype);


module.exports = Job;
