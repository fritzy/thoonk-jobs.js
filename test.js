#!/usr/bin/env node

/*global console */
var cp = require('child_process');
var reporter = require('nodeunit').reporters['default'];
var config = require('getconfig');

if (process.env.NODE_ENV !== 'test') {
    console.error('Invalid environment detected, aborting tests');
    process.exit(1);
}
if (!config.enabled) {
    console.error('Testing not enabled. Set "enabled: true" in test_config.json');
}

// a shared error callback
function errCallback(err) {
    if (err) {
        console.log(err);
        process.exit(1);
    } else {
        process.exit(0);
    }
}

// global error handler... log/exit
process.on('uncaughtException', errCallback);

console.log('Starting tests');
reporter.run(['tests/happypaths.js'], null, errCallback);
