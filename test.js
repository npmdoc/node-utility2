/*jslint
    browser: true,
    maxerr: 4,
    maxlen: 96,
    node: true,
    nomen: true,
    stupid: true
*/
(function () {
    'use strict';
    var local;



    // run shared js-env code
    (function () {
        // init local
        local = {};
        local.modeJs = (function () {
            try {
                return module.exports &&
                    typeof process.versions.node === 'string' &&
                    typeof require('http').createServer === 'function' &&
                    'node';
            } catch (errorCaughtNode) {
                return typeof navigator.userAgent === 'string' &&
                    typeof document.querySelector('body') === 'object' &&
                    'browser';
            }
        }());
        // init global
        local.global = local.modeJs === 'browser'
            ? window
            : global;
        // init utility2
        local.utility2 = local.modeJs === 'browser'
            ? window.utility2
            : require('./index.js');
        // init istanbul_lite
        local.istanbul_lite = local.utility2.local.istanbul_lite;
        // init jslint_lite
        local.jslint_lite = local.utility2.local.jslint_lite;

        // init tests
        local.testCase_ajax_default = function (onError) {
            /*
                this function will test ajax's default handling behavior
            */
            var onParallel;
            onParallel = local.utility2.onParallel(onError);
            onParallel.counter += 1;
            // test http GET handling behavior
            onParallel.counter += 1;
            local.utility2.ajax({ url: '/test/hello' }, function (error, data) {
                local.utility2.testTryCatch(function () {
                    // validate no error occurred
                    local.utility2.assert(!error, error);
                    // validate data
                    local.utility2.assert(data === 'hello', data);
                    onParallel();
                }, onParallel);
            });
            // test http POST handling behavior
            ['binary', 'text'].forEach(function (resultType) {
                onParallel.counter += 1;
                local.utility2.ajax({
                    data: resultType === 'binary' && local.modeJs === 'node'
                        // test binary post handling behavior
                        ? new Buffer('hello')
                        // test text post handling behavior
                        : 'hello',
                    // test request header handling behavior
                    headers: { 'X-Header-Hello': 'Hello' },
                    method: 'POST',
                    resultType: resultType,
                    url: '/test/echo'
                }, function (error, data) {
                    local.utility2.testTryCatch(function () {
                        // validate no error occurred
                        local.utility2.assert(!error, error);
                        // validate binary data
                        if (resultType === 'binary' &&
                                local.modeJs === 'node') {
                            local.utility2.assert(Buffer.isBuffer(data), data);
                            data = String(data);
                        }
                        // validate text data
                        local.utility2.assert(data.indexOf('hello') >= 0, data);
                        onParallel();
                    }, onParallel);
                });
            });
            [{
                // test 404-not-found-error handling behavior
                url: '/test/undefined?modeErrorIgnore=1'
            }, {
                // test 500-internal-server-error handling behavior
                url: '/test/server-error?modeErrorIgnore=1'
            }, {
                // test timeout handling behavior
                timeout: 1,
                url: '/test/timeout'
            }, {
                // test undefined https host handling behavior
                timeout: 1,
                url: 'https://undefined' + Date.now() + Math.random() + '.com'
            }].forEach(function (options) {
                onParallel.counter += 1;
                local.utility2.ajax(options, function (error) {
                    local.utility2.testTryCatch(function () {
                        // validate error occurred
                        local.utility2.assert(error instanceof Error, error);
                        onParallel();
                    }, onParallel);
                });
            });
            onParallel();
        };

        local.testCase_assert_default = function (onError) {
            /*
                this function will test assert's default handling behavior
            */
            var error;
            // test assertion passed
            local.utility2.assert(true, true);
            // test assertion failed with undefined message
            local.utility2.testTryCatch(function () {
                local.utility2.assert(false);
            }, function (error) {
                // validate error occurred
                local.utility2.assert(error instanceof Error, error);
                // validate error-message
                local.utility2.assert(error.message === '', error.message);
            });
            // test assertion failed with error object
            // with no error.message and no error.trace
            error = new Error();
            error.message = '';
            error.stack = '';
            local.utility2.testTryCatch(function () {
                local.utility2.assert(false, error);
            }, function (error) {
                // validate error occurred
                local.utility2.assert(error instanceof Error, error);
                // validate error.message
                local.utility2.assert(
                    error.message === 'undefined',
                    error.message
                );
            });
            // test assertion failed with text message
            local.utility2.testTryCatch(function () {
                local.utility2.assert(false, 'hello');
            }, function (error) {
                // validate error occurred
                local.utility2.assert(error instanceof Error, error);
                // validate error-message
                local.utility2.assert(
                    error.message === 'hello',
                    error.message
                );
            });
            // test assertion failed with error object
            local.utility2.testTryCatch(function () {
                local.utility2.assert(false, local.utility2.errorDefault);
            }, function (error) {
                // validate error occurred
                local.utility2.assert(error instanceof Error, error);
            });
            // test assertion failed with json object
            local.utility2.testTryCatch(function () {
                local.utility2.assert(false, { aa: 1 });
            }, function (error) {
                // validate error occurred
                local.utility2.assert(error instanceof Error, error);
                // validate error-message
                local.utility2.assert(
                    error.message === '{"aa":1}',
                    error.message
                );
            });
            onError();
        };

        local.testCase_debug_print_default = function (onError) {
            /*
                this function will test debug_print's default handling behavior
            */
            var message;
            local.utility2.testMock([
                // suppress console.error
                [console, { error: function (arg) {
                    message += (arg || '') + '\n';
                } }]
            ], onError, function (onError) {
                message = '';
                local.global['debug_print'.replace('_p', 'P')]('hello');
                // validate message
                local.utility2.assert(
                    message === '\n\n\n' +
                        'debug_print'.replace('_p', 'P') +
                        '\nhello\n\n',
                    message
                );
                onError();
            });
        };

        local.testCase_jsonCopy_default = function (onError) {
            /*
                this function will test jsonCopy's default handling behavior
            */
            // test various data-type handling behavior
            [
                undefined,
                null,
                false,
                true,
                0,
                1,
                1.5,
                'a'
            ].forEach(function (data) {
                local.utility2.assert(
                    local.utility2.jsonCopy(data) === data,
                    [local.utility2.jsonCopy(data), data]
                );
            });
            onError();
        };

        local.testCase_jsonStringifyOrdered_default = function (onError) {
            /*
                this function will test jsonStringifyOrdered's
                default handling behavior
            */
            var data;
            // test various data-type handling behavior
            [
                undefined,
                null,
                false,
                true,
                0,
                1,
                1.5,
                'a',
                {},
                []
            ].forEach(function (data) {
                local.utility2.assert(
                    local.utility2.jsonStringifyOrdered(data) ===
                        JSON.stringify(data),
                    [
                            local.utility2.jsonStringifyOrdered(data),
                            JSON.stringify(data)
                        ]
                );
            });
            // test data-ordering handling behavior
            data = local.utility2.jsonStringifyOrdered({
                // test nested dict handling behavior
                ee: { gg: 2, ff: 1},
                // test array handling behavior
                dd: [undefined],
                cc: local.utility2.nop,
                bb: 2,
                aa: 1
            });
            local.utility2.assert(
                data === '{"aa":1,"bb":2,"dd":[null],"ee":{"ff":1,"gg":2}}',
                data
            );
            onError();
        };

        local.testCase_onErrorDefault_default = function (onError) {
            /*
                this function will test onErrorDefault's
                default handling behavior
            */
            var message;
            local.utility2.testMock([
                // suppress console.error
                [console, { error: function (arg) {
                    message = arg;
                } }]
            ], onError, function (onError) {
                // test no error handling behavior
                local.utility2.onErrorDefault();
                // validate message
                local.utility2.assert(!message, message);
                // test error handling behavior
                local.utility2.onErrorDefault(local.utility2.errorDefault);
                // validate message
                local.utility2.assert(message, message);
                onError();
            });
        };

        local.testCase_onParallel_default = function (onError) {
            /*
                this function will test onParallel's default handling behavior
            */
            var onParallel, onParallelError;
            // test onDebug handling behavior
            onParallel = local.utility2.onParallel(onError, function (
                error,
                self
            ) {
                local.utility2.testTryCatch(function () {
                    // validate no error occurred
                    local.utility2.assert(!error, error);
                    // validate self
                    local.utility2.assert(self.counter >= 0, self);
                }, onError);
            });
            onParallel.counter += 1;
            onParallel.counter += 1;
            setTimeout(function () {
                onParallelError = local.utility2.onParallel(function (error) {
                    local.utility2.testTryCatch(function () {
                        // validate error occurred
                        local.utility2.assert(error instanceof Error, error);
                        onParallel();
                    }, onParallel);
                });
                onParallelError.counter += 1;
                // test error handling behavior
                onParallelError.counter += 1;
                onParallelError(local.utility2.errorDefault);
                // test ignore-after-error handling behavior
                onParallelError();
            });
            // test default handling behavior
            onParallel();
        };

        local.testCase_onTimeout_timeout = function (onError) {
            /*
                this function will test onTimeout's timeout handling behavior
            */
            var timeElapsed;
            timeElapsed = Date.now();
            local.utility2.onTimeout(function (error) {
                local.utility2.testTryCatch(function () {
                    // validate error occurred
                    local.utility2.assert(error instanceof Error);
                    // save timeElapsed
                    timeElapsed = Date.now() - timeElapsed;
                    // validate timeElapsed passed is greater than timeout
                    // bug - ie might timeout slightly earlier,
                    // so increase timeElapsed by a small amount
                    local.utility2.assert(
                        timeElapsed + 100 >= 1000,
                        timeElapsed
                    );
                    onError();
                }, onError);
            // coverage-hack
            // use 1500 ms to cover setInterval test-report refresh in browser
            }, 1500, 'testCase_onTimeout_errorTimeout');
        };

        local.testCase_setDefault_default = function (onError) {
            /*
                this function will test setDefault's default handling behavior
            */
            var options;
            // test non-recursive handling behavior
            options = local.utility2.setDefault(
                { aa: 1, bb: {}, cc: [] },
                1,
                { aa: 2, bb: { cc: 2 }, cc: [1, 2] }
            );
            // validate options
            local.utility2.assert(
                local.utility2.jsonStringifyOrdered(options) ===
                    '{"aa":1,"bb":{},"cc":[]}',
                options
            );
            // test recursive handling behavior
            options = local.utility2.setDefault(
                { aa: 1, bb: {}, cc: [] },
                -1,
                { aa: 2, bb: { cc: 2 }, cc: [1, 2] }
            );
            // validate options
            local.utility2.assert(
                local.utility2.jsonStringifyOrdered(options) ===
                    '{"aa":1,"bb":{"cc":2},"cc":[]}',
                options
            );
            onError();
        };

        local.testCase_setOverride_default = function (onError) {
            /*
                this function will test setOverride's default handling behavior
            */
            var backup, data, options;
            backup = {};
            // test override handling behavior
            options = local.utility2.setOverride(
                {
                    aa: 1,
                    bb: { cc: 2 },
                    dd: [3, 4],
                    ee: { ff: { gg: 5, hh: 6 } }
                },
                // test depth handling behavior
                2,
                {
                    aa: 2,
                    bb: { dd: 3 },
                    dd: [4, 5],
                    ee: { ff: { gg: 6 } }
                },
                // test backup handling behavior
                backup
            );
            // validate backup
            data = local.utility2.jsonStringifyOrdered(backup);
            local.utility2.assert(data ===
                '{"aa":1,"bb":{},"dd":[3,4],' +
                '"ee":{"ff":{"gg":5,"hh":6}}}', data);
            // validate options
            data = local.utility2.jsonStringifyOrdered(options);
            local.utility2.assert(data ===
                '{"aa":2,"bb":{"cc":2,"dd":3},"dd":[4,5],' +
                '"ee":{"ff":{"gg":6}}}', data);
            // test restore options from backup handling behavior
            local.utility2.setOverride(options, -1, backup);
            // validate backup
            data = local.utility2.jsonStringifyOrdered(backup);
            local.utility2.assert(data ===
                '{"aa":1,"bb":{"dd":3},"dd":[3,4],' +
                '"ee":{"ff":{"gg":6}}}', data);
            // validate options
            data = local.utility2.jsonStringifyOrdered(options);
            local.utility2.assert(data ===
                '{"aa":1,"bb":{"cc":2},"dd":[3,4],' +
                '"ee":{"ff":{"gg":5,"hh":6}}}', data);
            // test override envDict with empty-string handling behavior
            options = local.utility2.setOverride(
                local.utility2.envDict,
                1,
                { 'emptyString': null }
            );
            // validate options
            local.utility2.assert(
                options.emptyString === '',
                options.emptyString
            );
            onError();
        };

        local.testCase_testRun_failure = function (onError) {
            /*
                this function will test testRun's failure handling behavior
            */
            // test failure from callback handling behavior
            onError(local.utility2.errorDefault);
            // test failure from multiple-callback handling behavior
            onError();
            // test failure from ajax handling behavior
            local.utility2.ajax({
                url: '/test/undefined?modeErrorIgnore=1'
            }, onError);
            // test failure from thrown error handling behavior
            throw local.utility2.errorDefault;
        };

        local.testCase_textFormat_default = function (onError) {
            /*
                this function will test textFormat's default handling behavior
            */
            var data;
            // test undefined valueDefault handling behavior
            data = local.utility2.textFormat('{{aa}}', {}, undefined);
            local.utility2.assert(data === '{{aa}}', data);
            // test default handling behavior
            data = local.utility2.textFormat(
                '{{aa}}{{aa}}{{bb}}{{cc}}{{dd}}{{ee.ff}}',
                {
                    // test string value handling behavior
                    aa: 'aa',
                    // test non-string value handling behavior
                    bb: 1,
                    // test null-value handling behavior
                    cc: null,
                    // test undefined-value handling behavior
                    dd: undefined,
                    // test nested value handling behavior
                    ee: { ff: 'gg' }
                },
                '<undefined>'
            );
            local.utility2.assert(data === 'aaaa1null<undefined>gg', data);
            // test list handling behavior
            data = local.utility2.textFormat(
                '[{{#list1}}[{{#list2}}{{aa}},{{/list2}}],{{/list1}}]',
                {
                    list1: [
                        // test null-value handling behavior
                        null,
                        // test recursive list handling behavior
                        { list2: [{ aa: 'bb' }, { aa: 'cc' }] }
                    ]
                },
                '<undefined>'
            );
            local.utility2.assert(
                data === '[[<undefined><undefined>,<undefined>],[bb,cc,],]',
                data
            );
            onError();
        };
    }());
    switch (local.modeJs) {



    // run browser js-env code
    case 'browser':
        // export local
        window.local = local;
        local.utility2.onErrorExit = function () {
            // test modeTest !== 'phantom' handling behavior
            if (local.utility2.modeTest === 'phantom2') {
                setTimeout(function () {
                    throw new Error('\nphantom\n' + JSON.stringify({
                        global_test_results: window.global_test_results
                    }));
                }, 1000);
            }
        };
        local._modeTest = local.utility2.modeTest;
        local.utility2.modeTest = null;
        local.utility2.testRun();
        local.utility2.modeTest = local._modeTest;
        // run test
        local.utility2.testRun(local);
        break;



    // run node js-env code
    case 'node':
        // require modules
        local.fs = require('fs');
        local.path = require('path');
        local.vm = require('vm');

        // init tests
        local.testCase_istanbulMerge_default = function (onError) {
            /*
                this function will test istanbulMerge's
                default handling behavior
            */
            var coverage1, coverage2, script;
            script = local.istanbul_lite.instrumentSync(
                '(function () {\nreturn arg ' +
                    '? __coverage__ ' +
                    ': __coverage__;\n}());',
                'test'
            );
            local.utility2.arg = 0;
            // jslint-hack
            local.utility2.nop(script);



            /* jslint-ignore-begin */
            // init coverage1
            coverage1 = local.vm.runInNewContext(script, { arg: 0 });
            // validate coverage1
            local.utility2.assert(local.utility2.jsonStringifyOrdered(coverage1) === '{"/test":{"b":{"1":[0,1]},"branchMap":{"1":{"line":2,"locations":[{"end":{"column":25,"line":2},"start":{"column":13,"line":2}},{"end":{"column":40,"line":2},"start":{"column":28,"line":2}}],"type":"cond-expr"}},"f":{"1":1},"fnMap":{"1":{"line":1,"loc":{"end":{"column":13,"line":1},"start":{"column":1,"line":1}},"name":"(anonymous_1)"}},"path":"/test","s":{"1":1,"2":1},"statementMap":{"1":{"end":{"column":5,"line":3},"start":{"column":0,"line":1}},"2":{"end":{"column":41,"line":2},"start":{"column":0,"line":2}}}}}', coverage1);
            // init coverage2
            coverage2 = local.vm.runInNewContext(script, { arg: 1 });
            // validate coverage2
            local.utility2.assert(local.utility2.jsonStringifyOrdered(coverage2) === '{"/test":{"b":{"1":[1,0]},"branchMap":{"1":{"line":2,"locations":[{"end":{"column":25,"line":2},"start":{"column":13,"line":2}},{"end":{"column":40,"line":2},"start":{"column":28,"line":2}}],"type":"cond-expr"}},"f":{"1":1},"fnMap":{"1":{"line":1,"loc":{"end":{"column":13,"line":1},"start":{"column":1,"line":1}},"name":"(anonymous_1)"}},"path":"/test","s":{"1":1,"2":1},"statementMap":{"1":{"end":{"column":5,"line":3},"start":{"column":0,"line":1}},"2":{"end":{"column":41,"line":2},"start":{"column":0,"line":2}}}}}', coverage2);
            // merge coverage2 into coverage1
            local.utility2.istanbulMerge(coverage1, coverage2);
            // validate merged coverage1
            local.utility2.assert(local.utility2.jsonStringifyOrdered(coverage1) === '{"/test":{"b":{"1":[1,1]},"branchMap":{"1":{"line":2,"locations":[{"end":{"column":25,"line":2},"start":{"column":13,"line":2}},{"end":{"column":40,"line":2},"start":{"column":28,"line":2}}],"type":"cond-expr"}},"f":{"1":2},"fnMap":{"1":{"line":1,"loc":{"end":{"column":13,"line":1},"start":{"column":1,"line":1}},"name":"(anonymous_1)"}},"path":"/test","s":{"1":2,"2":2},"statementMap":{"1":{"end":{"column":5,"line":3},"start":{"column":0,"line":1}},"2":{"end":{"column":41,"line":2},"start":{"column":0,"line":2}}}}}', coverage1);
            /* jslint-ignore-end */



            // test null-case handling behavior
            coverage1 = null;
            coverage2 = null;
            local.utility2.istanbulMerge(coverage1, coverage2);
            // validate merged coverage1
            local.utility2.assert(coverage1 === null, coverage1);
            onError();
        };

        local.testCase_onFileModifiedRestart_default = function (onError) {
            /*
                this function will test onFileModifiedRestart's
                watchFile handling behavior
            */
            var file, onParallel;
            file = __dirname + '/package.json';
            onParallel = local.utility2.onParallel(onError);
            onParallel.counter += 1;
            local.fs.stat(file, function (error, stat) {
                // test default watchFile handling behavior
                onParallel.counter += 1;
                local.fs.utimes(file, stat.atime, new Date(), onParallel);
                // test nop watchFile handling behavior
                onParallel.counter += 1;
                setTimeout(function () {
                    local.fs.utimes(file, stat.atime, stat.mtime, onParallel);
                // coverage-hack
                // use 1500 ms to cover setInterval watchFile in node
                }, 1500);
                onParallel(error);
            });
        };

        local.testCase_phantomTest_default = function (onError) {
            /*
                this function will test phantomTest's default handling behavior
            */
            var onParallel, options;
            onParallel = local.utility2.onParallel(onError);
            onParallel.counter += 1;
            [{
                // test default handling behavior
                url: 'http://localhost:' +
                    local.utility2.envDict.npm_config_server_port +
                    // test phantom-callback handling behavior
                    '?modeTest=phantom&' +
                    // test _testSecret-validation handling behavior
                    '_testSecret={{_testSecret}}'
            }, {
                modeError: true,
                modeErrorIgnore: true,
                url: 'http://localhost:' +
                    local.utility2.envDict.npm_config_server_port +
                    // test script-error handling behavior
                    '/test/script-error.html'
            }, {
                modeError: true,
                modeErrorIgnore: true,
                // run phantom self-test
                modePhantomSelfTest: true,
                url: 'http://localhost:' +
                    local.utility2.envDict.npm_config_server_port +
                    // test standalone script handling behavior
                    '/test/script-standalone.html?' +
                    // test modeTest !== 'phantom' handling behavior
                    'modeTest=phantom2&' +
                    // test single-test-case handling behavior
                    // test testRun's failure handling behavior
                    'modeTestCase=testCase_testRun_failure'
            }].forEach(function (options) {
                onParallel.counter += 1;
                local.utility2.phantomTest(options, function (error) {
                    local.utility2.testTryCatch(function () {
                        // validate error occurred
                        if (options.modeError) {
                            local.utility2.assert(
                                error instanceof Error,
                                error
                            );
                        // validate no error occurred
                        } else {
                            local.utility2.assert(!error, error);
                        }
                        onParallel();
                    }, onParallel);
                });
            });
            // test screenCapture handling behavior
            onParallel.counter += 1;
            options = {
                modeErrorIgnore: true,
                timeoutScreenCapture: 1,
                url: 'http://localhost:' +
                    local.utility2.envDict.npm_config_server_port +
                    '/test/script-error.html'
            };
            local.utility2.phantomScreenCapture(options, function (error) {
                local.utility2.testTryCatch(function () {
                    // validate no error occurred
                    local.utility2.assert(!error, error);
                    // validate screen-capture file
                    local.utility2.assert(
                        options.phantomjs.fileScreenCapture &&
                            local.fs.existsSync(
                                options.phantomjs.fileScreenCapture
                            ),
                        options.phantomjs.fileScreenCapture
                    );
                    // remove screen-capture file,
                    // so it will not interfere with re-test
                    local.fs.unlinkSync(options.phantomjs.fileScreenCapture);
                    onParallel();
                }, onParallel);
            });
            // test misc handling behavior
            onParallel.counter += 1;
            local.utility2.testMock([
                [local.utility2, {
                    envDict: {
                        // test no slimerjs handling behavior
                        npm_config_mode_no_slimerjs: '1',
                        // test no cover utility2.js handling behavior
                        npm_package_name: 'undefined'
                    },
                    onTimeout: local.utility2.nop
                }],
                [local.utility2.local, {
                    child_process: { spawn: function () {
                        return { on: local.utility2.nop };
                    } }
                }]
            ], onParallel, function (onError) {
                local.utility2.phantomTest({
                    url: 'http://localhost:' +
                        local.utility2.envDict.npm_config_server_port
                });
                onError();
            });
            onParallel();
        };

        local.testCase_replStart_default = function (onError) {
            /*
                this function will test replStart's default handling behavior
            */
            /*jslint evil: true*/
            local.utility2.testMock([
                [local.utility2.local, {
                    child_process: { spawn: function () {
                        return { on: function (event, callback) {
                            // jslint-hack
                            local.utility2.nop(event);
                            callback();
                        } };
                    } }
                }]
            ], onError, function (onError) {
                [
                    // test shell handling behavior
                    '$ :\n',
                    // test git diff handling behavior
                    '$ git diff\n',
                    // test git log handling behavior
                    '$ git log\n',
                    // test grep handling behavior
                    'grep \\bhello\\b\n',
                    // test print handling behavior
                    'print\n'
                ].forEach(function (script) {
                    local.utility2.local._replServer.eval(
                        script,
                        null,
                        'repl',
                        local.utility2.nop
                    );
                });
                onError();
            });
        };

        local.testCase_testRunServer_misc = function (onError) {
            /*
                this function will test testRunServer's misc handling behavior
            */
            local.utility2.testMock([
                [local.utility2, {
                    envDict: {
                        // test $npm_package_name !== 'utility2'
                        // handling behavior
                        npm_package_name: 'undefined',
                        // test exit-after-timeout handling behavior
                        npm_config_timeout_exit: '1',
                        // test random $npm_config_server_port handling behavior
                        npm_config_server_port: ''
                    }
                }],
                [local.utility2, {
                    phantomScreenCapture: local.utility2.nop
                }],
                [local.utility2.local, {
                    http: {
                        createServer: function () {
                            return { listen: local.utility2.nop };
                        }
                    }
                }]
            ], onError, function (onError) {
                local.utility2.testRunServer({ serverMiddlewareList: [] });
                // validate $npm_config_server_port
                local.utility2.assert(
                    Number(local.utility2.envDict.npm_config_server_port),
                    local.utility2.envDict.npm_config_server_port
                );
                onError();
            });
        };

        // init assets
        local['/'] =
            local.utility2['/test/test.html'];
        local['/assets/istanbul-lite.js'] =
            local.istanbul_lite['/assets/istanbul-lite.js'];
        local['/assets/utility2.css'] =
            local.utility2['/assets/utility2.css'];
        local['/assets/utility2.js'] =
            local.istanbul_lite.instrumentInPackage(
                local.utility2['/assets/utility2.js'],
                __dirname + '/index.js',
                'utility2'
            );
        local['/test/hello'] =
            'hello';
        local['/test/script-error.html'] =
            '<script>syntax error</script>';
        local['/test/script-standalone.html'] =
            '<script src="/assets/utility2.js">\n' +
                '</script><script src="/test/test.js"></script>';
        local['/test/test.js'] =
            local.istanbul_lite.instrumentInPackage(
                local.fs.readFileSync(__filename, 'utf8'),
                __filename,
                'utility2'
            );
        // init serverMiddlewareList
        local.serverMiddlewareList = [
            function (request, response, onNext) {
                /*
                    this function will run the the test-middleware
                */
                switch (request.urlPathNormalized) {
                // serve assets
                case '/':
                case '/assets/istanbul-lite.js':
                case '/assets/utility2.css':
                case '/assets/utility2.js':
                case '/test/hello':
                case '/test/script-error.html':
                case '/test/script-standalone.html':
                case '/test/test.js':
                    response.end(local[request.urlPathNormalized]);
                    break;
                // test http POST handling behavior
                case '/test/echo':
                    local.utility2.serverRespondEcho(request, response);
                    break;
                // test timeout handling behavior
                case '/test/timeout':
                    setTimeout(function () {
                        response.end();
                    }, 1000);
                    break;
                // test 500-internal-server-error handling behavior
                case '/test/server-error':
                    // test multiple serverRespondWriteHead callback
                    // handling behavior
                    local.utility2.serverRespondWriteHead(
                        request,
                        response,
                        null,
                        {}
                    );
                    onNext(local.utility2.errorDefault);
                    // test multiple-callback error handling behavior
                    onNext(local.utility2.errorDefault);
                    // test onErrorDefault handling behavior
                    local.utility2.testMock([
                        // suppress console.error
                        [console, { error: local.utility2.nop }],
                        // suppress modeErrorIgnore
                        [request, { url: '' }]
                    ], local.utility2.nop, function (onError) {
                        local.utility2.serverRespondDefault(
                            request,
                            response,
                            500,
                            local.utility2.errorDefault
                        );
                        onError();
                    });
                    break;
                // default to next middleware
                default:
                    onNext();
                }
            }
        ];
        // run server-test
        local.utility2.testRunServer(local);
        // init dir
        local.fs.readdirSync(__dirname).forEach(function (file) {
            file = __dirname + '/' + file;
            switch (local.path.extname(file)) {
            case '.js':
            case '.json':
                // jslint the file
                local.jslint_lite.jslintAndPrint(
                    local.fs.readFileSync(file, 'utf8'),
                    file
                );
                break;
            }
            // if the file is modified, then restart the process
            local.utility2.onFileModifiedRestart(file);
        });
        // jslint /assets/utility2.css
        local.jslint_lite.jslintAndPrint(
            local.utility2['/assets/utility2.css'],
            '/assets/utility2.css'
        );
        // init repl debugger
        local.utility2.replStart({ local: local });
        break;
    }
}());
