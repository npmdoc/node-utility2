/*jslint
    bitwise: true,
    browser: true,
    maxerr: 8,
    maxlen: 96,
    node: true,
    nomen: true,
    stupid: true
*/
(function (local) {
    'use strict';



    // run shared js-env code
    (function () {
        local._timeElapsedStop = function (options) {
            /*
                this function will stop options.timeElapsed
            */
            if (options.timeElapsed > 0xffffffff) {
                options.timeElapsed = Date.now() - options.timeElapsed;
            }
        };

        local.utility2.assert = function (passed, message) {
            /*
                this function will throw an error if the assertion fails
            */
            if (!passed) {
                throw new Error(
                    // if message is a string, then leave it as is
                    typeof message === 'string'
                        ? message
                        // if message is an Error object, then get its stack
                        : message instanceof Error
                        ? local.utility2.errorStack(message)
                        // else JSON.stringify message
                        : JSON.stringify(message)
                );
            }
        };

        local.utility2.errorStack = function (error) {
            /*
                this function will return the error's stack
            */
            return error.stack || error.message || 'undefined';
        };

        local.utility2.istanbulMerge = function (coverage1, coverage2) {
            /*
                this function will merge coverage2 into coverage1
            */
            var dict1, dict2;
            coverage1 = coverage1 || {};
            coverage2 = coverage2 || {};
            Object.keys(coverage2).forEach(function (file) {
                // if file is undefined in coverage1, then add it
                if (!coverage1[file]) {
                    coverage1[file] = coverage2[file];
                    return;
                }
                // merge file from coverage2 into coverage1
                ['b', 'f', 's'].forEach(function (key) {
                    dict1 = coverage1[file][key];
                    dict2 = coverage2[file][key];
                    switch (key) {
                    // increment coverage for branch lines
                    case 'b':
                        Object.keys(dict2).forEach(function (key) {
                            dict2[key].forEach(function (count, ii) {
                                dict1[key][ii] = dict1[key][ii]
                                    ? dict1[key][ii] + count
                                    : count;
                            });
                        });
                        break;
                    // increment coverage for function and statement lines
                    case 'f':
                    case 's':
                        Object.keys(dict2).forEach(function (key) {
                            dict1[key] = dict1[key]
                                ? dict1[key] + dict2[key]
                                : dict2[key];
                        });
                        break;
                    }
                });
            });
            return coverage1;
        };

        local.utility2.jsonCopy = function (value) {
            /*
                this function will return a deep-copy of the JSON value
            */
            return value === undefined
                ? undefined
                : JSON.parse(JSON.stringify(value));
        };

        local.utility2.jsonStringifyOrdered = function (value, replacer, space) {
            /*
                this function will JSON.stringify the value with dictionaries in sorted order,
                for testing purposes
            */
            var stringifyOrdered;
            stringifyOrdered = function (value) {
                /*
                    this function will recursively stringify the value,
                    and sort its object-keys along the way
                */
                // if value is an array, then recursively stringify its elements
                if (Array.isArray(value)) {
                    return '[' + value.map(stringifyOrdered).join(',') + ']';
                }
                // if value is an object,
                // then recursively stringify its items sorted by their keys
                if (value && typeof value === 'object') {
                    return '{' + Object.keys(value)
                        .sort()
                        .map(function (key) {
                            return JSON.stringify(key) + ':' + stringifyOrdered(value[key]);
                        })
                        .join(',') + '}';
                }
                // else JSON.stringify normally
                return JSON.stringify(value);
            };
            value = JSON.stringify(value);
            return typeof value === 'string'
                ? JSON.stringify(
                    JSON.parse(stringifyOrdered(JSON.parse(value))),
                    replacer,
                    space
                )
                : value;
        };

        local.utility2.listShuffle = function (list) {
            /*
                this function will inplace shuffle the list, via fisher-yates algorithm
                https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
            */
            var ii, random, swap;
            for (ii = list.length - 1; ii > 0; ii -= 1) {
                // coerce to finite integer
                random = (Math.random() * ii) | 0;
                swap = list[ii];
                list[ii] = list[random];
                list[random] = swap;
            }
            return list;
        };

        local.utility2.objectSetDefault = function (options, defaults, depth) {
            /*
                this function will recursively set default values for unset leaf nodes
                in the options object
            */
            Object.keys(defaults).forEach(function (key) {
                var defaults2, options2;
                defaults2 = defaults[key];
                options2 = options[key];
                // init options[key] to default value defaults[key]
                if (options2 === undefined) {
                    options[key] = defaults2;
                    return;
                }
                // if options2 and defaults2 are both non-null and non-array objects,
                // then recurse options2 and defaults2
                if (depth && depth !== 1 &&
                        // options2 is a non-null and non-array object
                        options2 &&
                        typeof options2 === 'object' &&
                        !Array.isArray(options2) &&
                        // defaults2 is a non-null and non-array object
                        defaults2 &&
                        typeof defaults2 === 'object' &&
                        !Array.isArray(defaults2)) {
                    local.utility2.objectSetDefault(options2, defaults2, depth - 1);
                }
            });
            return options;
        };

        local.utility2.objectSetOverride = function (options, override, depth) {
            /*
                this function will recursively override the options object
                with the override object
            */
            var options2, override2;
            Object.keys(override).forEach(function (key) {
                options2 = options[key];
                override2 = override[key];
                // if either options2 or override2 is not a non-null and non-array object,
                // then set options[key] with override[key]
                if (!depth || depth === 1 ||
                        // options2 is not a non-null and non-array object
                        !(options2 &&
                        typeof options2 === 'object' &&
                        !Array.isArray(options2)) ||
                        // override2 is not a non-null and non-array object
                        !(override2 &&
                        typeof override2 === 'object' &&
                        !Array.isArray(override2))) {
                    options[key] = options === local.utility2.envDict
                        // if options is envDict, then override falsey value with empty string
                        ? override2 || ''
                        : override2;
                    return;
                }
                // else recurse options2 and override2
                local.utility2.objectSetOverride(options2, override2, depth - 1);
            });
            return options;
        };

        local.utility2.objectTraverse = function (element, onSelf) {
            /*
                this function will recursively traverse the element,
                and call onSelf on the element's properties
            */
            onSelf(element);
            if (element && typeof element === 'object') {
                Object.keys(element).forEach(function (key) {
                    local.utility2.objectTraverse(element[key], onSelf);
                });
            }
            return element;
        };

        local.utility2.onErrorDefault = function (error) {
            /*
                this function will provide a default error handling callback,
                that prints the error.stack or error.message to stderr
            */
            // if error is defined, then print the error stack
            if (error) {
                console.error('\nonErrorDefault - error\n' +
                    local.utility2.errorStack(error) + '\n');
            }
        };

        local.utility2.onErrorExit = local.utility2.exit;

        local.utility2.onErrorWithStack = function (onError) {
            /*
                this function will return a new callback that calls onError,
                will the caller-stack appended to any errors
            */
            var errorStack;
            try {
                throw new Error();
            } catch (errorCaught) {
                errorStack = errorCaught.stack;
            }
            return function () {
                var args;
                args = arguments;
                if (args[0]) {
                    // try to append errorStack to args[0].stack
                    try {
                        args[0].stack = args[0].stack
                            ? args[0].stack + '\n' + errorStack
                            : errorStack;
                    } catch (ignore) {
                    }
                }
                onError.apply(null, args);
            };
        };

        local.utility2.onTaskEnd = function (onError, onDebug) {
            /*
                this function will return a function that will
                1. runs async tasks in parallel,
                2. if counter === 0 or error occurs, then call onError
            */
            var self;
            onDebug = onDebug || local.utility2.nop;
            self = function (error) {
                local.utility2.onErrorWithStack(function (error) {
                    onDebug(error, self);
                    // if counter === 0 or error already occurred, then return
                    if (self.counter === 0 || self.error) {
                        return;
                    }
                    // error handling behavior
                    if (error) {
                        self.error = error;
                        // ensure counter will decrement to 0
                        self.counter = 1;
                    }
                    // decrement counter
                    self.counter -= 1;
                    // if counter === 0, then call onError with error
                    if (self.counter === 0) {
                        onError(error);
                    }
                })(error);
            };
            // init counter
            self.counter = 0;
            // return callback
            return self;
        };

        local.utility2.onErrorJsonParse = function (onError) {
            /*
                this function will return a wrapper function,
                that will JSON.parse the data with error handling
            */
            return function (error, data) {
                if (error) {
                    onError(error);
                    return;
                }
                try {
                    data = JSON.parse(data);
                } catch (errorCaught) {
                    onError(new Error('JSON.parse failed - ' + errorCaught.message));
                    return;
                }
                onError(null, data);
            };
        };

        local.utility2.onTimeout = function (onError, timeout, message) {
            /*
                this function will create a timeout error-handler,
                that will append the caller-stack to any errors
            */
            onError = local.utility2.onErrorWithStack(onError);
            // create timeout timer
            return setTimeout(function () {
                onError(new Error('onTimeout - timeout error - ' +
                    timeout + ' ms - ' +
                    message));
            // coerce to finite integer
            }, timeout | 0);
        };

        local.utility2.onTimeoutRequestResponseDestroy = function (
            onError,
            timeout,
            message,
            request,
            response
        ) {
            /*
                this function will destroy the request and response object
                after the given timeout
            */
            return local.utility2.onTimeout(function (error) {
                onError(error);
                // cleanup request
                request.destroy();
                // cleanup response
                response.destroy();
            }, timeout, message);
        };

        local.utility2.stringFormat = function (template, dict, valueDefault) {
            /*
                this function will replace the keys in the template
                with the key / value pairs provided by the dict
            */
            var match, replace, rgx, value;
            dict = dict || {};
            replace = function (match0, fragment) {
                // jslint-hack
                local.utility2.nop(match0);
                return dict[match].map(function (dict) {
                    // recursively format the array fragment
                    return local.utility2.stringFormat(
                        fragment,
                        dict,
                        valueDefault
                    );
                }).join('');
            };
            rgx = (/\{\{#\S+?\}\}/g);
            while (true) {
                // search for array fragments in the template
                match = rgx.exec(template);
                if (!match) {
                    break;
                }
                match = match[0].slice(3, -2);
                // if value is an array, then iteratively format the array fragment with it
                if (Array.isArray(dict[match])) {
                    template = template.replace(
                        new RegExp('\\{\\{#' + match +
                            '\\}\\}([\\S\\s]*?)\\{\\{\\/' + match +
                            '\\}\\}'),
                        replace
                    );
                }
            }
            // search for keys in the template
            return template.replace((/\{\{\S+?\}\}/g), function (keyList) {
                value = dict;
                // iteratively lookup nested values in the dict
                keyList.slice(2, -2).split('.').forEach(function (key) {
                    value = value && value[key];
                });
                return value === undefined
                    ? (valueDefault === undefined
                    ? keyList
                    : valueDefault)
                    : value;
            });
        };

        local.utility2.taskCacheCreateOrAddCallback = function (taskCache, onTask, onError) {
            /*
                this function will
                1. if taskCache is already defined, then add onError to its callbackList
                2. else create a new taskCache, that will cleanup itself after onTask ends
            */
            // init taskCacheDict
            local.utility2.taskCacheDict = local.utility2.taskCacheDict || {};
            // 1. if taskCache is already defined, then add onError to its callbackList
            if (local.utility2.taskCacheDict[taskCache.key]) {
                local.utility2.taskCacheDict[taskCache.key].callbackList
                    .push(local.utility2.onErrorWithStack(onError));
                return;
            }
            // 2. else create a new taskCache, that will cleanup itself after onTask ends
            local.utility2.taskCacheDict[taskCache.key] = taskCache;
            taskCache.callbackList = [local.utility2.onErrorWithStack(onError)];
            taskCache.onEnd = function () {
                if (taskCache.done) {
                    return;
                }
                taskCache.done = true;
                // cleanup timerTimeout
                clearTimeout(taskCache.timerTimeout);
                // cleanup taskCache
                delete local.utility2.taskCacheDict[taskCache.key];
                // pass result to callbacks in callbackList
                taskCache.result = arguments;
                taskCache.callbackList.forEach(function (onError) {
                    onError.apply(null, taskCache.result);
                });
            };
            // init timerTimeout
            taskCache.timerTimeout = local.utility2.onTimeout(
                taskCache.onEnd,
                taskCache.timeout || local.utility2.timeoutDefault,
                'taskCacheCreateOrAddCallback ' + taskCache.key
            );
            // run onTask
            onTask(taskCache.onEnd);
        };

        local.utility2.testMock = function (mockList, onTestCase, onError) {
            /*
                this function will mock the objects in mockList
                while running the onTestCase
            */
            var onError2;
            onError2 = function (error) {
                // restore mock[0] from mock[2]
                mockList.reverse().forEach(function (mock) {
                    local.utility2.objectSetOverride(mock[0], mock[2]);
                });
                onError(error);
            };
            // run onError callback in mocked objects in a try-catch block
            local.utility2.testTryCatch(function () {
                // mock objects
                mockList.forEach(function (mock) {
                    mock[2] = {};
                    // backup mock[0] into mock[2]
                    Object.keys(mock[1]).forEach(function (key) {
                        mock[2][key] = mock[0][key];
                    });
                    // override mock[0] with mock[1]
                    local.utility2.objectSetOverride(mock[0], mock[1]);
                });
                // run onTestCase
                onTestCase(onError2);
            }, onError2);
        };

        local.utility2.testMerge = function (testReport1, testReport2) {
            /*
                this function will
                1. merge testReport2 into testReport1
                2. return testReport1 in html-format
            */
            var errorStackList, testCaseNumber, testReport;
            // 1. merge testReport2 into testReport1
            [testReport1, testReport2].forEach(function (testReport, ii) {
                ii += 1;
                local.utility2.objectSetDefault(testReport, {
                    date: new Date().toISOString(),
                    errorStackList: [],
                    testPlatformList: [],
                    timeElapsed: 0
                }, -1);
                // security - handle malformed testReport
                local.utility2.assert(
                    testReport && typeof testReport === 'object',
                    ii + ' invalid testReport ' + typeof testReport
                );
                local.utility2.assert(
                    typeof testReport.timeElapsed === 'number',
                    ii + ' invalid testReport.timeElapsed ' + typeof testReport.timeElapsed
                );
                // security - handle malformed testReport.testPlatformList
                testReport.testPlatformList.forEach(function (testPlatform) {
                    local.utility2.objectSetDefault(testPlatform, {
                        name: 'undefined',
                        testCaseList: [],
                        timeElapsed: 0
                    }, -1);
                    local.utility2.assert(
                        typeof testPlatform.name === 'string',
                        ii + ' invalid testPlatform.name ' +
                            typeof testPlatform.name
                    );
                    // insert $MODE_BUILD into testPlatform.name
                    if (local.utility2.envDict.MODE_BUILD) {
                        testPlatform.name = testPlatform.name.replace(
                            (/^(browser|node|phantom|slimer)\b/),
                            local.utility2.envDict.MODE_BUILD + ' - $1'
                        );
                    }
                    local.utility2.assert(
                        typeof testPlatform.timeElapsed === 'number',
                        ii + ' invalid testPlatform.timeElapsed ' +
                            typeof testPlatform.timeElapsed
                    );
                    // security - handle malformed testPlatform.testCaseList
                    testPlatform.testCaseList.forEach(function (testCase) {
                        local.utility2.objectSetDefault(testCase, {
                            errorStack: '',
                            name: 'undefined',
                            timeElapsed: 0
                        }, -1);
                        local.utility2.assert(
                            typeof testCase.errorStack === 'string',
                            ii + ' invalid testCase.errorStack ' +
                                typeof testCase.errorStack
                        );
                        local.utility2.assert(
                            typeof testCase.name === 'string',
                            ii + ' invalid testCase.name ' +
                                typeof testCase.name
                        );
                        local.utility2.assert(
                            typeof testCase.timeElapsed === 'number',
                            ii + ' invalid testCase.timeElapsed ' +
                                typeof testCase.timeElapsed
                        );
                    });
                });
            });
            // merge testReport2.testPlatformList into testReport1.testPlatformList
            testReport2.testPlatformList.forEach(function (testPlatform2) {
                // add testPlatform2 to testReport1.testPlatformList
                testReport1.testPlatformList.push(testPlatform2);
            });
            // update testReport1.timeElapsed
            if (testReport1.timeElapsed < 0xffffffff) {
                testReport1.timeElapsed += testReport2.timeElapsed;
            }
            testReport = testReport1;
            testReport.testsFailed = 0;
            testReport.testsPassed = 0;
            testReport.testsPending = 0;
            testReport.testPlatformList.forEach(function (testPlatform) {
                testPlatform.testsFailed = 0;
                testPlatform.testsPassed = 0;
                testPlatform.testsPending = 0;
                testPlatform.testCaseList.forEach(function (testCase) {
                    // update failed tests
                    if (testCase.errorStack) {
                        testCase.status = 'failed';
                        testPlatform.testsFailed += 1;
                        testReport.testsFailed += 1;
                    // update passed tests
                    } else if (testCase.timeElapsed < 0xffffffff) {
                        testCase.status = 'passed';
                        testPlatform.testsPassed += 1;
                        testReport.testsPassed += 1;
                    // update pending tests
                    } else {
                        testCase.status = 'pending';
                        testPlatform.testsPending += 1;
                        testReport.testsPending += 1;
                    }
                });
                // update testPlatform.status
                testPlatform.status = testPlatform.testsFailed
                    ? 'failed'
                    : testPlatform.testsPending
                    ? 'pending'
                    : 'passed';
                // sort testCaseList by status and name
                testPlatform.testCaseList.sort(function (arg1, arg2) {
                    arg1 = arg1.status
                        .replace('passed', 'z') + arg1.name.toLowerCase();
                    arg2 = arg2.status
                        .replace('passed', 'z') + arg2.name.toLowerCase();
                    return arg1 <= arg2
                        ? -1
                        : 1;
                });
            });
            // sort testPlatformList by status and name
            testReport.testPlatformList.sort(function (arg1, arg2) {
                arg1 = arg1.status
                    .replace('passed', 'z') + arg1.name.toLowerCase();
                arg2 = arg2.status
                    .replace('passed', 'z') + arg2.name.toLowerCase();
                return arg1 <= arg2
                    ? -1
                    : 1;
            });
            // stop testReport timer
            if (testReport.testsPending === 0) {
                local._timeElapsedStop(testReport);
            }
            // 2. return testReport1 in html-format
            // json-copy testReport, which will be modified for html templating
            testReport = local.utility2.jsonCopy(testReport1);
            // update timeElapsed
            local._timeElapsedStop(testReport);
            testReport.testPlatformList.forEach(function (testPlatform) {
                local._timeElapsedStop(testPlatform);
                testPlatform.testCaseList.forEach(function (testCase) {
                    local._timeElapsedStop(testCase);
                    testPlatform.timeElapsed = Math.max(
                        testPlatform.timeElapsed,
                        testCase.timeElapsed
                    );
                });
                // update testReport.timeElapsed with testPlatform.timeElapsed
                testReport.timeElapsed =
                    Math.max(testReport.timeElapsed, testPlatform.timeElapsed);
            });
            // create html test-report
            testCaseNumber = 0;
            return local.utility2.stringFormat(
                local.utility2['/test/test-report.html.template'],
                local.utility2.objectSetOverride(testReport, {
                    // security - sanitize '<' in string
                    CI_COMMIT_INFO: String(
                        local.utility2.envDict.CI_COMMIT_INFO
                    ).replace((/</g), '&lt;'),
                    envDict: local.utility2.envDict,
                    // map testPlatformList
                    testPlatformList: testReport.testPlatformList
                        .filter(function (testPlatform) {
                            // if testPlatform has no tests, then filter it out
                            return testPlatform.testCaseList.length;
                        })
                        .map(function (testPlatform, ii) {
                            errorStackList = [];
                            return local.utility2.objectSetOverride(testPlatform, {
                                errorStackList: errorStackList,
                                // security - sanitize '<' in string
                                name: String(testPlatform.name).replace((/</g), '&lt;'),
                                screenCapture: testPlatform.screenCaptureImg
                                    ? '<img class="testReportPlatformScreenCaptureImg" src="' +
                                        testPlatform.screenCaptureImg + '">'
                                    : '',
                                // map testCaseList
                                testCaseList: testPlatform.testCaseList.map(function (
                                    testCase
                                ) {
                                    testCaseNumber += 1;
                                    if (testCase.errorStack) {
                                        errorStackList.push({
                                            errorStack: (
                                                testCaseNumber + '. ' + testCase.name + '\n' +
                                                    testCase.errorStack
                                            // security - sanitize '<' in string
                                            ).replace((/</g), '&lt;')
                                        });
                                    }
                                    return local.utility2.objectSetOverride(testCase, {
                                        testCaseNumber: testCaseNumber,
                                        testReportTestStatusClass: 'testReportTest' +
                                            testCase.status[0].toUpperCase() +
                                            testCase.status.slice(1)
                                    }, -1);
                                }),
                                testReportPlatformPreClass:
                                    'testReportPlatformPre' + (errorStackList.length
                                    ? ''
                                    : 'Hidden'),
                                testPlatformNumber: ii + 1
                            });
                        }, -1),
                    testsFailedClass: testReport.testsFailed
                        ? 'testReportTestFailed'
                        : 'testReportTestPassed'
                }, -1),
                'undefined'
            );
        };

        local.utility2.testRun = function (options) {
            /*
                this function will run all tests in testPlatform.testCaseList
            */
            var coverageReportCreate,
                exit,
                onTaskEnd,
                separator,
                testPlatform,
                testReport,
                testReportDiv,
                testReportHtml,
                timerInterval;
            // init modeTest
            options = options || {};
            local.utility2.modeTest =
                local.utility2.modeTest ||
                local.utility2.envDict.npm_config_mode_npm_test;
            if (!(local.utility2.modeTest || options.modeTest)) {
                return;
            }
            // init onTaskEnd
            onTaskEnd = local.utility2.onTaskEnd(function () {
                /*
                    this function will create the test-report after all tests have done
                */
                // restore exit
                local.utility2.exit = exit;
                // init new-line separator
                separator = new Array(56).join('-');
                // stop testPlatform timer
                local._timeElapsedStop(testPlatform);
                // create testReportHtml
                testReportHtml = local.utility2.testMerge(testReport, {});
                // print test-report summary
                console.log('\n' + separator +
                    '\n' + testReport.testPlatformList
                    .filter(function (testPlatform) {
                        // if testPlatform has no tests, then filter it out
                        return testPlatform.testCaseList.length;
                    })
                    .map(function (testPlatform) {
                        return '| test-report - ' + testPlatform.name + '\n|' +
                            ('        ' + testPlatform.timeElapsed + ' ms     ')
                            .slice(-16) +
                            ('        ' + testPlatform.testsFailed + ' failed ')
                            .slice(-16) +
                            ('        ' + testPlatform.testsPassed + ' passed ')
                            .slice(-16) +
                            '     |\n' + separator;
                    })
                    .join('\n') + '\n');
                switch (local.modeJs) {
                case 'browser':
                    // notify saucelabs of test results
// https://docs.saucelabs.com/reference/rest-api/#js-unit-testing
                    local.global.global_test_results = {
                        coverage: local.global.__coverage__,
                        failed: testReport.testsFailed,
                        testReport: testReport
                    };
                    setTimeout(function () {
                        // update coverageReport
                        coverageReportCreate();
                        // call callback with number of tests failed
                        local.utility2.onErrorExit(testReport.testsFailed);
                        // throw global_test_results as an error,
                        // so it can be caught and passed to the phantom js-env
                        if (local.utility2.modeTest === 'phantom') {
                            throw new Error('\nphantom\n' + JSON.stringify({
                                global_test_results:
                                    local.global.global_test_results
                            }));
                        }
                    }, 1000);
                    break;
                case 'node':
                    // create build badge
                    local.fs.writeFileSync(
                        local.utility2.envDict.npm_config_dir_build +
                            '/build.badge.svg',
                        local.utility2['/build/build.badge.svg']
                            // edit branch name
                            .replace(
                                (/0000 00 00 00 00 00/g),
                                new Date()
                                    .toISOString()
                                    .slice(0, 19)
                                    .replace('T', ' ')
                            )
                            // edit branch name
                            .replace(
                                (/- master -/g),
                                '| ' + local.utility2.envDict.CI_BRANCH + ' |'
                            )
                            // edit commit id
                            .replace(
                                (/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/g),
                                local.utility2.envDict.CI_COMMIT_ID
                            )
                    );
                    // create test-report.badge.svg
                    local.fs.writeFileSync(
                        local.utility2.envDict.npm_config_dir_build +
                            '/test-report.badge.svg',
                        local.utility2['/build/test-report.badge.svg']
                            // edit number of tests failed
                            .replace((/999/g), testReport.testsFailed)
                            // edit badge color
                            .replace(
                                (/d00/g),
                                // coverage-hack - cover both fail and pass cases
                                '0d00'.slice(!!testReport.testsFailed).slice(0, 3)
                            )
                    );
                    // create test-report.html
                    local.fs.writeFileSync(
                        local.utility2.envDict.npm_config_dir_build + '/test-report.html',
                        testReportHtml
                    );
                    console.log('created test-report file://' +
                        local.utility2.envDict.npm_config_dir_build + '/test-report.html');
                    // create test-report.json
                    local.fs.writeFileSync(
                        local.utility2.envDict.npm_config_dir_build + '/test-report.json',
                        JSON.stringify(testReport)
                    );
                    // if any test failed, then exit with non-zero exit-code
                    setTimeout(function () {
                        // finalize testReport
                        local.utility2.testMerge(testReport, {});
                        console.log('\n' + local.utility2.envDict.MODE_BUILD +
                            ' - ' + testReport.testsFailed +
                            ' failed tests\n');
                        // call callback with number of tests failed
                        local.utility2.onErrorExit(testReport.testsFailed);
                    }, 1000);
                    break;
                }
            });
            onTaskEnd.counter += 1;
            // mock exit
            exit = local.utility2.exit;
            local.utility2.exit = local.utility2.nop;
            // init coverageReportCreate
            coverageReportCreate =
                (local.istanbul_lite && local.istanbul_lite.coverageReportCreate) ||
                local.utility2.nop;
            // init modeTestCase
            local.utility2.modeTestCase =
                local.utility2.modeTestCase ||
                local.utility2.envDict.npm_config_mode_test_case;
            // init testReport
            testReport = local.utility2.testReport;
            // init testReport timer
            testReport.timeElapsed = Date.now();
            // init testPlatform
            testPlatform = local.utility2.testPlatform;
            // init testPlatform timer
            testPlatform.timeElapsed = Date.now();
            // reset testPlatform.testCaseList
            local.utility2.testPlatform.testCaseList.length = 0;
            // add tests into testPlatform.testCaseList
            Object.keys(options).forEach(function (key) {
                // add test-case options[key] to testPlatform.testCaseList
                if (key.indexOf('testCase_') === 0 &&
                        (local.utility2.modeTestCase === key ||
                        (!local.utility2.modeTestCase && key !== 'testCase_testRun_failure'))) {
                    local.utility2.testPlatform.testCaseList.push({
                        name: key,
                        onTestCase: options[key],
                        timeElapsed: Date.now()
                    });
                }
            });
            // visually update test-progress until it finishes
            if (local.modeJs === 'browser') {
                // init testReportDiv element
                testReportDiv = document.querySelector('.testReportDiv') || { style: {} };
                testReportDiv.style.display = 'block';
                testReportDiv.innerHTML = local.utility2.testMerge(testReport, {});
                // update test-report status every 1000 ms until done
                timerInterval = setInterval(function () {
                    // update testReportDiv in browser
                    testReportDiv.innerHTML = local.utility2.testMerge(testReport, {});
                    if (testReport.testsPending === 0) {
                        // cleanup timerInterval
                        clearInterval(timerInterval);
                    }
                    // update coverageReport
                    coverageReportCreate();
                }, 1000);
                // update coverageReport
                coverageReportCreate();
            }
            // shallow copy testPlatform.testCaseList,
            // to guard against in-place sort from testMerge
            testPlatform.testCaseList.slice().forEach(function (testCase) {
                var done, onError, timerTimeout;
                onError = function (error) {
                    // cleanup timerTimeout
                    clearTimeout(timerTimeout);
                    // if testCase already done, then fail testCase with error for ending again
                    if (done) {
                        error = error || new Error('callback in testCase ' +
                            testCase.name +
                            ' called multiple times');
                    }
                    // if error occurred, then fail testCase
                    if (error) {
                        console.error('\ntestCase ' + testCase.name +
                            ' failed\n' + local.utility2.errorStack(error));
                        testCase.errorStack = testCase.errorStack ||
                            local.utility2.errorStack(error);
                        // validate errorStack is non-empty
                        local.utility2.assert(
                            testCase.errorStack,
                            'invalid errorStack ' + testCase.errorStack
                        );
                    }
                    // if testCase already done, then do not run finish code again
                    if (done) {
                        return;
                    }
                    // finish testCase
                    done = true;
                    // stop testCase timer
                    local._timeElapsedStop(testCase);
                    // if all tests have done, then create test-report
                    onTaskEnd();
                };
                // init timerTimeout
                timerTimeout = local.utility2.onTimeout(
                    onError,
                    local.utility2.timeoutDefault,
                    testCase.name
                );
                // increment number of tests remaining
                onTaskEnd.counter += 1;
                // run testCase in try-catch block
                try {
                    // start testCase timer
                    testCase.timeElapsed = Date.now();
                    testCase.onTestCase(onError);
                } catch (errorCaught) {
                    onError(errorCaught);
                }
            });
            onTaskEnd();
        };

        local.utility2.testTryCatch = function (callback, onError) {
            /*
                this function will call the callback in a try-catch block,
                and pass any error caught to onError
            */
            try {
                callback();
            } catch (errorCaught) {
                onError(errorCaught);
            }
        };

        local.utility2.uuid4 = function () {
            /*
                this function will return a random uuid,
                with form "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
            */
            // code derived from http://jsperf.com/uuid4
            var id, ii;
            id = 0;
            for (ii = 1; ii < 32; ii += 1) {
                switch (ii) {
                case 8:
                case 20:
                    id += '-';
                    // coerce to finite integer
                    id += (Math.random() * 16 | 0).toString(16);
                    break;
                case 12:
                    id += '-';
                    id += '4';
                    break;
                case 16:
                    id += '-';
                    id += (Math.random() * 4 | 8).toString(16);
                    break;
                default:
                    // coerce to finite integer
                    id += (Math.random() * 16 | 0).toString(16);
                }
            }
            return id;
        };

        local.utility2.uuidTime = function () {
            /*
                this function will return a time-based variant of uuid4,
                with form "tttttttt-tttx-4xxx-yxxx-xxxxxxxxxxxx"
            */
            return Date.now().toString(16).replace(/([0-9a-f]{8})/, '$1-') +
                local.utility2.uuid4().slice(12);
        };
    }());
    switch (local.modeJs) {



    // run browser js-env code
    case 'browser':
        local.utility2.ajax = function (options, onError) {
            /*
                this function will make an ajax request
                with error handling and timeout
            */
            var ajaxProgressDiv, data, done, error, ii, onEvent, timerTimeout, xhr;
            // init ajaxProgressDiv
            ajaxProgressDiv = document.querySelector('.ajaxProgressDiv') || { style: {} };
            // init event handling
            onEvent = local.utility2.onErrorWithStack(function (event) {
                switch (event.type) {
                case 'abort':
                case 'error':
                case 'load':
                    // cleanup timerTimeout
                    clearTimeout(timerTimeout);
                    // validate done is falsey
                    local.utility2.assert(!done, done);
                    // init done to true
                    done = true;
                    // validate xhr is defined in _ajaxProgressList
                    ii = local._ajaxProgressList.indexOf(xhr);
                    local.utility2.assert(ii >= 0, 'missing xhr in _ajaxProgressList');
                    // remove xhr from ajaxProgressList
                    local._ajaxProgressList.splice(ii, 1);
                    // handle abort or error event
                    if (!error &&
                            (event.type === 'abort' ||
                            event.type === 'error' ||
                            xhr.status >= 400)) {
                        error = new Error(event.type);
                    }
                    // handle completed xhr request
                    if (xhr.readyState === 4) {
                        // handle string data
                        data = xhr.responseText;
                        if (error) {
                            // add http method/ statusCode / url debug-info to error.message
                            error.message = options.method + ' ' +
                                xhr.status + ' - ' +
                                options.url + '\n' +
                                JSON.stringify(xhr.responseText.slice(0, 256) + '...') +
                                '\n' + error.message;
                            // debug statusCode
                            error.statusCode = xhr.status;
                        }
                    }
                    // hide _ajaxProgressDiv
                    if (local._ajaxProgressList.length === 0) {
                        local._ajaxProgressBarHide = setTimeout(function () {
                            // hide ajaxProgressBar
                            ajaxProgressDiv.style.display = 'none';
                            // reset ajaxProgress
                            local._ajaxProgressState = 0;
                            local._ajaxProgressUpdate(
                                '0%',
                                'ajaxProgressBarDivLoading',
                                'loading'
                            );
                        }, 1000);
                    }
                    onError(error, data, xhr);
                    break;
                }
                // increment ajaxProgressBar
                if (local._ajaxProgressList.length > 0) {
                    local._ajaxProgressIncrement();
                    return;
                }
                // finish ajaxProgressBar
                local._ajaxProgressUpdate('100%', 'ajaxProgressBarDivSuccess', 'loaded');
            });
            // init xhr
            xhr = new XMLHttpRequest();
            // debug xhr
            local._debugXhr = xhr;
            // init event handling
            xhr.addEventListener('abort', onEvent);
            xhr.addEventListener('error', onEvent);
            xhr.addEventListener('load', onEvent);
            xhr.addEventListener('loadstart', local._ajaxProgressIncrement);
            xhr.addEventListener('progress', local._ajaxProgressIncrement);
            xhr.upload.addEventListener('progress', local._ajaxProgressIncrement);
            // init timerTimeout
            timerTimeout = local.utility2.onTimeout(function (errorTimeout) {
                error = errorTimeout;
                xhr.abort();
            }, options.timeout || local.utility2.timeoutDefault, 'ajax');
            // if ajaxProgressBar is hidden, then display it
            if (local._ajaxProgressList.length === 0) {
                ajaxProgressDiv.style.display = 'block';
            }
            // add xhr to _ajaxProgressList
            local._ajaxProgressList.push(xhr);
            // open url
            xhr.open(options.method || 'GET', options.url);
            // send request headers
            Object.keys(options.headers || {}).forEach(function (key) {
                xhr.setRequestHeader(key, options.headers[key]);
            });
            // clear any pending timer to hide _ajaxProgressDiv
            clearTimeout(local._ajaxProgressBarHide);
            // send data
            xhr.send(options.data);
        };

        local._ajaxProgressIncrement = function () {
            /*
                this function will increment ajaxProgressBar
            */
            // this algorithm can indefinitely increment the ajaxProgressBar
            // with successively smaller increments without ever reaching 100%
            local._ajaxProgressState += 1;
            local._ajaxProgressUpdate(
                100 - 75 * Math.exp(-0.125 * local._ajaxProgressState) + '%',
                'ajaxProgressBarDivLoading',
                'loading'
            );
        };

        // init list of xhr used in ajaxProgress
        local._ajaxProgressList = [];

        // init _ajaxProgressState
        local._ajaxProgressState = 0;

        local._ajaxProgressUpdate = function (width, type, label) {
            /*
                this function will visually update ajaxProgressBar
            */
            var ajaxProgressBarDiv;
            ajaxProgressBarDiv =
                document.querySelector('.ajaxProgressBarDiv') ||
                { className: '', style: {} };
            ajaxProgressBarDiv.style.width = width;
            ajaxProgressBarDiv.className = ajaxProgressBarDiv.className
                .replace((/ajaxProgressBarDiv\w+/), type);
            ajaxProgressBarDiv.innerHTML = label;
        };
        break;



    // run node js-env code
    case 'node':
        local.utility2.ajax = function (options, onError) {
            /*
                this function will make an ajax request
                with error handling and timeout
            */
            var done,
                modeNext,
                onNext,
                request,
                response,
                responseText,
                timerTimeout,
                urlParsed;
            modeNext = 0;
            onNext = local.utility2.onErrorWithStack(function (error, data) {
                modeNext = error instanceof Error
                    ? NaN
                    : modeNext + 1;
                switch (modeNext) {
                case 1:
                    // init request and response
                    request = response = { destroy: local.utility2.nop };
                    // init timerTimeout
                    timerTimeout = local.utility2.onTimeoutRequestResponseDestroy(
                        onNext,
                        options.timeout || local.utility2.timeoutDefault,
                        'ajax ' + options.method + ' ' + options.url,
                        request,
                        response
                    );
                    // handle implicit localhost
                    if (options.url[0] === '/') {
                        options.url = 'http://localhost:' +
                            local.utility2.envDict.npm_config_server_port +
                            options.url;
                    }
                    // parse options.url
                    urlParsed = local.url.parse(String(options.url));
                    // disable socket pooling
                    options.agent = options.agent || false;
                    // hostname needed for http.request
                    options.hostname = urlParsed.hostname;
                    // path needed for http.request
                    options.path = urlParsed.path;
                    // port needed for http.request
                    options.port = urlParsed.port;
                    // init headers
                    options.headers = options.headers || {};
                    // init Content-Length header
                    options.headers['Content-Length'] =
                        typeof options.data === 'string'
                        ? Buffer.byteLength(options.data)
                        : Buffer.isBuffer(options.data)
                        ? options.data.length
                        : 0;
                    // make http request
                    request = (urlParsed.protocol === 'https:'
                        ? local.https
                        : local.http).request(options, onNext)
                        // handle error event
                        .on('error', onNext);
                    // debug ajax request
                    local._debugAjaxRequest = request;
                    // send request and/or data
                    request.end(options.data);
                    break;
                case 2:
                    response = error;
                    // debug ajax response
                    local._debugAjaxResponse = response;
                    local.utility2.streamReadAll(response, onNext);
                    break;
                case 3:
                    // init responseText
                    responseText = options.resultType === 'binary'
                        ? data
                        : data.toString();
                    // error handling for http statusCode >= 400
                    if (response.statusCode >= 400) {
                        onNext(new Error(responseText));
                        return;
                    }
                    // successful response
                    onNext();
                    break;
                default:
                    // if already done, then ignore error / data
                    if (done) {
                        return;
                    }
                    done = true;
                    // cleanup timerTimeout
                    clearTimeout(timerTimeout);
                    // cleanup request
                    request.destroy();
                    // cleanup response
                    response.destroy();
                    if (error) {
                        // add http method / statusCode / url debug-info to error.message
                        error.message = options.method + ' ' +
                            (response && response.statusCode) + ' - ' +
                            options.url + '\n' +
                            JSON.stringify(
                                (responseText || '').slice(0, 256) + '...'
                            ) +
                            '\n' + error.message;
                        // debug statusCode
                        error.statusCode = response && response.statusCode;
                    }
                    onError(error, responseText, { status: response.statusCode });
                }
            });
            onNext();
        };

        local.utility2.middlewareCacheControlLastModified = function (
            request,
            response,
            nextMiddleware
        ) {
            /*
                this function will respond with the data cached by Last-Modified header
            */
            // do not cache if headers already sent or url has '?' search indicator
            if (!response.headersSent && request.url.indexOf('?') < 0) {
                // init serverResponseHeaderLastModified
                local.utility2.serverResponseHeaderLastModified =
                    local.utility2.serverResponseHeaderLastModified ||
                    // default Last-Modified header to server-start-time
                    new Date(Date.now() - process.uptime()).toGMTString();
                // respond with 304 if If-Modified-Since is greater than server-start-time
                if (request.headers['if-modified-since'] >=
                        local.utility2.serverResponseHeaderLastModified) {
                    response.statusCode = 304;
                    response.end();
                    return;
                }
                response.setHeader('Cache-Control', 'no-cache');
                response.setHeader(
                    'Last-Modified',
                    local.utility2.serverResponseHeaderLastModified
                );
            }
            nextMiddleware();
        };

        local.utility2.middlewareGroupCreate = function (middlewareList) {
            /*
               this function will return a middleware
               that will sequentially run the sub-middlewares in middlewareList
            */
            var self;
            self = function (request, response, nextMiddleware) {
                /*
                    this function will create a middleware,
                    that will sequentially run the sub-middlewares in middlewareList
                */
                var modeNext, onNext;
                modeNext = -1;
                onNext = function (error) {
                    modeNext = error instanceof Error
                        ? NaN
                        : modeNext + 1;
                    // recursively run each sub-middleware in middlewareList
                    if (modeNext < self.middlewareList.length) {
                        self.middlewareList[modeNext](request, response, onNext);
                        return;
                    }
                    // default to nextMiddleware
                    nextMiddleware(error);
                };
                onNext();
            };
            self.middlewareList = middlewareList;
            return self;
        };

        local.utility2.middlewareInit = function (request, response, nextMiddleware) {
            var contentTypeDict;
            // debug server request
            local._debugServerRequest = request;
            // debug server response
            local._debugServerResponse = response;
            // init timerTimeout
            local.utility2
                .serverRespondTimeoutDefault(request, response, local.utility2.timeoutDefault);
            // cleanup timerTimeout
            response.on('finish', function () {
                // cleanup timerTimeout
                clearTimeout(request.timerTimeout);
                // cleanup request
                request.destroy();
                // cleanup response
                response.destroy();
            });
            // check if _testSecret is valid
            request._testSecretValid = (/\b_testSecret=(\w+)\b/).exec(request.url);
            request._testSecretValid = request._testSecretValid &&
                request._testSecretValid[1] === local.utility2._testSecret;
            // init request.urlParsed
            request.urlParsed = local.url.parse(request.url, true);
            // init request.urlParsed.pathnameNormalized
            request.urlParsed.pathnameNormalized = local.path.resolve(
                request.urlParsed.pathname
            );
            // init Content-Type header
            contentTypeDict = {
                '.css': 'text/css; charset=UTF-8',
                '.html': 'text/html; charset=UTF-8',
                '.js': 'application/javascript; charset=UTF-8',
                '.json': 'application/json; charset=UTF-8',
                '.txt': 'text/plain; charset=UTF-8'
            };
            local.utility2.serverRespondSetHead(request, response, null, {
                'Content-Type': contentTypeDict[
                    local.path.extname(request.urlParsed.pathnameNormalized)
                ]
            });
            // run nextMiddleware
            nextMiddleware();
        };

        local.utility2.onFileModifiedRestart = function (file) {
            /*
                this function will watch the file,
                and if modified, then restart the process
            */
            if (local.utility2.envDict.npm_config_mode_auto_restart &&
                    local.fs.statSync(file).isFile()) {
                local.fs.watchFile(file, {
                    interval: 1000,
                    persistent: false
                }, function (stat2, stat1) {
                    if (stat2.mtime > stat1.mtime) {
                        local.utility2.exit(1);
                    }
                });
            }
        };

        local.utility2.onMiddlewareError = function (error, request, response) {
            // if error occurred, then respond with '500 Internal Server Error',
            // else respond with '404 Not Found'
            local.utility2.serverRespondDefault(request, response, error
                ? 500
                : 404, error);
        };

        local.utility2.phantomScreenCapture = function (options, onError) {
            /*
                this function will spawn both phantomjs and slimerjs processes
                to screen-capture options.url
            */
            local.utility2.phantomTest(local.utility2.objectSetDefault(options, {
                modePhantom: 'screenCapture',
                timeoutScreenCapture: 2000
            }, 1), onError);
        };

        local.utility2.phantomTest = function (options, onError) {
            /*
                this function will spawn both phantomjs and slimerjs processes
                to test options.url
            */
            var onTaskEnd;
            onTaskEnd = local.utility2.onTaskEnd(onError);
            onTaskEnd.counter += 1;
            ['phantomjs', 'slimerjs'].forEach(function (argv0) {
                var optionsCopy;
                // if slimerjs is not available, then do not use it
                if (argv0 === 'slimerjs' &&
                        (!local.utility2.envDict.npm_config_mode_slimerjs ||
                        local.utility2.envDict.npm_config_mode_no_slimerjs)) {
                    return;
                }
                // copy options to create separate phantomjs / slimerjs state
                optionsCopy = local.utility2.jsonCopy(options);
                optionsCopy.argv0 = argv0;
                // run phantomjs / slimerjs instance
                onTaskEnd.counter += 1;
                local._phantomTestSingle(optionsCopy, function (error) {
                    // save phantomjs / slimerjs state to options
                    options[argv0] = optionsCopy;
                    onTaskEnd(error);
                });
            });
            onTaskEnd();
        };

        local._phantomTestSingle = function (options, onError) {
            /*
                this function will spawn a single phantomjs or slimerjs process
                to test options.url
            */
            var modeNext, onNext, onTaskEnd, timerTimeout;
            modeNext = 0;
            onNext = function (error) {
                modeNext = error instanceof Error
                    ? NaN
                    : modeNext + 1;
                switch (modeNext) {
                case 1:
                    options.testName = local.utility2.envDict.MODE_BUILD +
                        '.' + options.argv0 + '.' +
                        encodeURIComponent(local.url.parse(options.url).pathname);
                    local.utility2.objectSetDefault(options, {
                        _testSecret: local.utility2._testSecret,
                        fileCoverage: local.utility2.envDict.npm_config_dir_tmp +
                            '/coverage.' + options.testName + '.json',
                        fileScreenCapture: (local.utility2.envDict.npm_config_dir_build +
                            '/screen-capture.' + options.testName + '.png')
                            .replace((/%/g), '_')
                            .replace((/_2F\.png$/), '.png'),
                        fileTestReport: local.utility2.envDict.npm_config_dir_tmp +
                            '/test-report.' + options.testName + '.json',
                        modePhantom: 'testUrl'
                    }, 1);
                    // init timerTimeout
                    timerTimeout = local.utility2.onTimeout(
                        onNext,
                        local.utility2.timeoutDefault,
                        options.testName
                    );
                    // coverage-hack - cover utility2 in phantomjs
                    options.argv1 = __dirname + '/index.js';
                    if (local.global.__coverage__ &&
                            local.utility2.envDict.npm_package_name === 'utility2') {
                        options.argv1 = local.utility2.envDict.npm_config_dir_tmp +
                            '/covered.utility2.js';
                        local.fs.writeFileSync(
                            options.argv1,
                            local.istanbul_lite.instrumentInPackage(
                                local.utility2['/assets/utility2.js'],
                                __dirname + '/index.js',
                                'utility2'
                            )
                        );
                    }
                    // spawn phantomjs to test a url
                    local.utility2
                        .processSpawnWithTimeout('/bin/sh', ['-c',
                            options.argv0 +
                            // bug - hack slimerjs to allow heroku https
                            (options.argv0 === 'slimerjs'
                            ? ' --ssl-protocol=TLS '
                            : ' ') +
                            options.argv1 + ' ' +
                            encodeURIComponent(JSON.stringify(options)) + '; ' +
                            'EXIT_CODE=$?; ' +
                            // add black border around phantomjs screen-capture
                            '[ -f ' + options.fileScreenCapture + ' ] && ' +
                            'mogrify -frame 1 -mattecolor black ' +
                            options.fileScreenCapture + ' 2>/dev/null; ' +
                            'exit $EXIT_CODE;'
                            ], { stdio: options.modeErrorIgnore ? 'ignore' : ['ignore', 1, 2] })
                        .on('exit', onNext);
                    break;
                case 2:
                    options.exitCode = error;
                    onTaskEnd = local.utility2.onTaskEnd(onNext);
                    onTaskEnd.counter += 1;
                    // merge coverage and test-report
                    [
                        options.fileCoverage,
                        options.fileTestReport
                    ].forEach(function (file, ii) {
                        onTaskEnd.counter += 1;
                        local.fs.readFile(
                            file,
                            'utf8',
                            local.utility2.onErrorJsonParse(function (error, data) {
                                if (!error) {
                                    // merge coverage
                                    if (ii === 0) {
                                        local.utility2.istanbulMerge(
                                            local.global.__coverage__,
                                            data
                                        );
                                    // merge test-report
                                    } else if (options.modePhantom === 'testUrl' &&
                                            !options.modeErrorIgnore) {
                                        local.utility2.testMerge(
                                            local.utility2.testReport,
                                            data
                                        );
                                    }
                                }
                                onTaskEnd();
                            })
                        );
                    });
                    onTaskEnd();
                    break;
                case 3:
                    onNext(options.exitCode && new Error(
                        options.argv0 + ' exit-code ' + options.exitCode
                    ));
                    break;
                default:
                    // cleanup timerTimeout
                    clearTimeout(timerTimeout);
                    onError(error);
                }
            };
            onNext();
        };

        local.utility2.processSpawnWithTimeout = function () {
            /*
                this function will run like child_process.spawn,
                but with auto-timeout after timeoutDefault milliseconds
            */
            var childProcess;
            // spawn childProcess
            childProcess = local.child_process.spawn.apply(local.child_process, arguments)
                // kill timerTimeout on exit
                .on('exit', function () {
                    try {
                        process.kill(childProcess.timerTimeout.pid);
                    } catch (ignore) {
                    }
                });
            // init timerTimeout
            childProcess.timerTimeout = local.child_process.spawn('/bin/sh', ['-c', 'sleep ' +
                // coerce to finite integer
                ((0.001 * local.utility2.timeoutDefault) | 0) +
                '; kill -9 ' + childProcess.pid + ' 2>/dev/null'], { stdio: 'ignore' });
            return childProcess;
        };

        local.utility2.replStart = function (globalDict) {
            /*
                this function will start the repl debugger
            */
            /*jslint evil: true*/
            Object.keys(globalDict).forEach(function (key) {
                local.global[key] = globalDict[key];
            });
            // start repl server
            local._replServer = require('repl').start({ useGlobal: true });
            // save repl eval function
            local._replServer.evalDefault = local._replServer.eval;
            // debug error
            if (local._replServer._domain) {
                local._replServer._domain.on('error', function (error) {
                    local._debugReplError = error;
                });
            }
            // hook custom repl eval function
            local._replServer.eval = function (script, context, file, onError) {
                var match, onError2;
                match = (/^(\S+)([\S\s]*?)\n/).exec(script);
                onError2 = function (error, data) {
                    // debug error
                    local._debugReplError = error || local._debugReplError;
                    onError(error, data);
                };
                switch (match && match[1]) {
                // syntax sugar to run async shell command
                case '$':
                    switch (match[2]) {
                    // syntax sugar to run git diff
                    case ' git diff':
                        match[2] = ' git diff --color | cat';
                        break;
                    // syntax sugar to run git log
                    case ' git log':
                        match[2] = ' git log -n 4 | cat';
                        break;
                    }
                    // run async shell command
                    local.utility2
                        .processSpawnWithTimeout(
                            '/bin/sh',
                            ['-c', '. ' + __dirname + '/index.sh && ' + match[2]],
                            { stdio: ['ignore', 1, 2] }
                        )
                        // on shell exit, print return prompt
                        .on('exit', function (exitCode) {
                            console.log('exit-code ' + exitCode);
                            local._replServer.evalDefault('\n', context, file, onError2);
                        });
                    return;
                // syntax sugar to grep current dir
                case 'grep':
                    // run async shell command
                    local.utility2
                        .processSpawnWithTimeout(
                            '/bin/sh',
                            ['-c', 'find . -type f | grep -v ' +
                                '"/\\.\\|.*\\b\\(\\.\\d\\|' +
                                'archive\\|artifacts\\|' +
                                'bower_components\\|build\\|' +
                                'coverage\\|' +
                                'docs\\|' +
                                'external\\|' +
                                'git_modules\\|' +
                                'jquery\\|' +
                                'log\\|logs\\|' +
                                'min\\|' +
                                'node_modules\\|' +
                                'rollup\\|' +
                                'swp\\|' +
                                'tmp\\)\\b" ' +
                                '| tr "\\n" "\\000" | xargs -0 grep -in "' +
                                match[2].trim() + '"'],
                            { stdio: ['ignore', 1, 2] }
                        )
                        // on shell exit, print return prompt
                        .on('exit', function (exitCode) {
                            console.log('exit-code ' + exitCode);
                            local._replServer.evalDefault('\n', context, file, onError2);
                        });
                    return;
                // syntax sugar to print stringified arg
                case 'print':
                    script = 'console.log(String(' + match[2] + '))\n';
                    break;
                }
                // eval modified script
                local.utility2.testTryCatch(function () {
                    local._replServer.evalDefault(script, context, file, onError2);
                }, onError2);
            };
        };

        local.utility2.serverRespondDefault = function (request, response, statusCode, error) {
            /*
                this function will respond with a default message,
                or error stack for the given statusCode
            */
            // init statusCode and contentType
            local.utility2.serverRespondSetHead(
                request,
                response,
                statusCode,
                { 'Content-Type': 'text/plain; charset=utf-8' }
            );
            if (error) {
                // if modeErrorIgnore is undefined in url search params,
                // then print error.stack to stderr
                if (!(/\?\S*?\bmodeErrorIgnore=1\b/).test(request.url)) {
                    local.utility2.onErrorDefault(error);
                }
                // end response with error.stack
                response.end(local.utility2.errorStack(error));
                return;
            }
            // end response with default statusCode message
            response.end(
                statusCode + ' ' + local.http.STATUS_CODES[statusCode]
            );
        };

        local.utility2.serverRespondEcho = function (request, response) {
            /*
                this function will respond with debug info
            */
            response.write(request.method + ' ' + request.url +
                ' HTTP/' + request.httpVersion + '\r\n' +
                Object.keys(request.headers).map(function (key) {
                    return key + ': ' + request.headers[key] + '\r\n';
                }).join('') + '\r\n');
            request.pipe(response);
        };

        local.utility2.serverRespondGzipCache = function (request, response, cacheKey, data) {
            /*
                this function will respond with auto-cached, gzipped data
            */
            // legacy-hack node 0.10 doesn't support zlib.gzipSync
            if (!local.zlib.gzipSync ||
                    response.headersSent ||
                    !(/\bgzip\b/).test(request.headers['accept-encoding'])) {
                response.end(data);
                return;
            }
            // init serverRespondGzipCacheDict
            local.utility2.serverRespondGzipCacheDict =
                local.utility2.serverRespondGzipCacheDict || {};
            data = local.utility2.serverRespondGzipCacheDict[cacheKey] =
                local.utility2.serverRespondGzipCacheDict[cacheKey] ||
                local.zlib.gzipSync(data);
            response.setHeader('content-encoding', 'gzip');
            response.end(data);
            return;
        };

        local.utility2.serverRespondSetHead = function (
            request,
            response,
            statusCode,
            headers
        ) {
            /*
                this function will set the response object's statusCode / headers
            */
            // jslint-hack
            local.utility2.nop(request);
            if (response.headersSent) {
                return;
            }
            // init response.statusCode
            if (statusCode) {
                response.statusCode = statusCode;
            }
            Object.keys(headers).forEach(function (key) {
                if (headers[key]) {
                    response.setHeader(key, headers[key]);
                }
            });
            return true;
        };

        local.utility2.serverRespondTimeoutDefault = function (request, response, timeout) {
            /*
                this function will create a timeout error-handler for the server request
            */
            request.onTimeout = request.onTimeout || function () {
                local.utility2.serverRespondDefault(request, response, 500);
            };
            request.timerTimeout = local.utility2.onTimeoutRequestResponseDestroy(
                function (error) {
                    console.error(request.method + ' ' + request.url);
                    local.utility2.onErrorDefault(error);
                    request.onTimeout(error);
                },
                timeout || local.utility2.timeoutDefault,
                'server ' + request.method + ' ' + request.url,
                request,
                response
            );
        };

        local.utility2.streamReadAll = function (readableStream, onError) {
            /*
                this function will concat data from the readableStream,
                and when done reading, then pass it to onError
            */
            var chunkList;
            chunkList = [];
            // read data from the readableStream
            readableStream
                // on data event, push the buffer chunk to chunkList
                .on('data', function (chunk) {
                    chunkList.push(chunk);
                })
                // on end event, pass concatenated read buffer to onError
                .on('end', function () {
                    onError(null, Buffer.concat(chunkList));
                })
                // on error event, pass error to onError
                .on('error', onError);
        };

        local.utility2.testRunServer = function (options) {
            /*
                this function will
                1. create server from options.middleware
                2. start server on port $npm_config_server_port
                3. if $npm_config_mode_npm_test is defined, then run tests
            */
            var server, testSecretCreate;
            // init _testSecret
            testSecretCreate = function () {
                local.utility2._testSecret = local.utility2.uuid4();
            };
            // init _testSecret
            testSecretCreate();
            local.utility2._testSecret =
                local.utility2.envDict.TEST_SECRET ||
                local.utility2._testSecret;
            // re-init _testSecret every 60 seconds
            setInterval(testSecretCreate, 60000).unref();
            // 1. create server from options.middleware
            server = local.http.createServer(function (request, response) {
                options.middleware(request, response, function (error) {
                    options.onMiddlewareError(error, request, response);
                });
            });
            // if $npm_config_server_port is undefined,
            // then assign it a random integer in the inclusive range 0 to 0xffff
            local.utility2.envDict.npm_config_server_port =
                local.utility2.envDict.npm_config_server_port ||
                // coerce to finite integer
                ((Math.random() * 0x10000) | 0x8000).toString();
            // 2. start server on port $npm_config_server_port
            console.log('server starting on port ' +
                local.utility2.envDict.npm_config_server_port);
            server.listen(
                local.utility2.envDict.npm_config_server_port,
                local.utility2.onReady
            );
            // if $npm_config_timeout_exit is defined,
            // then exit this process after $npm_config_timeout_exit ms
            if (Number(local.utility2.envDict.npm_config_timeout_exit)) {
                setTimeout(function () {
                    console.log('server stopping on port ' +
                        local.utility2.envDict.npm_config_server_port);
                    // screen-capture main-page
                    local.utility2.phantomScreenCapture({
                        modeErrorIgnore: true,
                        url: 'http://localhost:' + local.utility2.envDict.npm_config_server_port
                    }, local.utility2.exit);
                }, Number(local.utility2.envDict.npm_config_timeout_exit))
                    // keep timerTimeout from blocking the process from exiting
                    .unref();
            }
            // 3. if $npm_config_mode_npm_test is defined, then run tests
            local.utility2.taskCacheCreateOrAddCallback(
                { key: 'utility2.onReady' },
                null,
                function () {
                    local.utility2.testRun(options);
                }
            );
            local.utility2.onReady.counter += 1;
            return server;
        };
        break;
    }



    // run shared js-env code
    (function () {
        local.utility2.errorDefault = new Error('default error');
        // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address
        local.utility2.regexpEmailValidate = new RegExp(
            '^[a-zA-Z0-9.!#$%&\'*+\\/=?\\^_`{|}~\\-]+@' +
                '[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?' +
                '(?:\\.[a-zA-Z0-9](?:[a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$'
        );
        local.utility2.regexpUriComponentCharset = (/[\w\!\%\'\(\)\*\-\.\~]/);
        local.utility2.regexpUuidValidate =
            (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        local.utility2.stringAsciiCharset = local.utility2.stringExampleAscii ||
            '\x00\x01\x02\x03\x04\x05\x06\x07\b\t\n\x0b\f\r\x0e\x0f' +
            '\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f' +
            ' !"#$%&\'()*+,-./0123456789:;<=>?' +
            '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_' +
            '`abcdefghijklmnopqrstuvwxyz{|}~\x7f';
        local.utility2.stringUriComponentCharset = '!%\'()*-.' +
            '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz~';
        local.utility2.testPlatform = {
            name: local.modeJs === 'browser'
                ? 'browser - ' + navigator.userAgent + ' - ' +
                    new Date().toISOString()
                : local.modeJs === 'node'
                ? 'node - ' + process.platform + ' ' + process.version + ' - ' +
                    new Date().toISOString()
                : (local.global.slimer
                    ? 'slimer - '
                    : 'phantom - ') +
                    local.system.os.name + ' ' +
                    local.global.phantom.version.major + '.' +
                    local.global.phantom.version.minor + '.' +
                    local.global.phantom.version.patch + ' - ' +
                    new Date().toISOString(),
            screenCaptureImg: local.utility2.envDict.MODE_BUILD_SCREEN_CAPTURE,
            testCaseList: []
        };
        local.utility2.testReport = { testPlatformList: [local.utility2.testPlatform] };
        local.utility2.timeoutDefault =
            local.utility2.envDict.npm_config_timeout_default ||
            local.utility2.timeoutDefault ||
            30000;
        // init onReady
        local.utility2.taskCacheCreateOrAddCallback(
            { key: 'utility2.onReady' },
            function (onError) {
                local.utility2.onReady = local.utility2.onTaskEnd(onError);
                local.utility2.onReady.counter += 1;
                setTimeout(local.utility2.onReady);
            },
            local.utility2.nop
        );
    }());
    switch (local.modeJs) {



    // run browser js-env code
    case 'browser':
        // parse url search-params that match 'mode*' or '_testSecret'
        location.search.replace(
            (/\b(mode[A-Z]\w+|_testSecret)=([\w\-\.\%]+)/g),
            function (match0, key, value) {
                // jslint-hack
                local.utility2.nop(match0);
                local.utility2[key] = value;
                // try to parse value as json object
                try {
                    local.utility2[key] = JSON.parse(value);
                } catch (ignore) {
                }
            }
        );
        break;



    // run node js-env code
    case 'node':
        // init assets
        local.utility2['/assets/utility2.js'] = local.fs.readFileSync(__filename, 'utf8');
        local.utility2['/test/test.html'] = local.utility2.stringFormat(local.fs
            .readFileSync(__dirname + '/README.md', 'utf8')
            .replace((/[\S\s]+?(<!DOCTYPE html>[\S\s]+?<\/html>)[\S\s]+/), '$1')
            // parse '\' line-continuation
            .replace((/\\\n/g), '')
            // remove "\\n' +" and "'"
            .replace((/\\n' \+(\s*?)'/g), '$1'), { envDict: local.utility2.envDict }, '');
        break;



    // run phantom js-env code
    case 'phantom':
        local.coverAndExit = function (coverage, exit, exitCode) {
            setTimeout(function () {
                if (coverage) {
                    local.fs.write(local.utility2.fileCoverage, JSON.stringify(coverage));
                }
                exit(exitCode);
            });
        };

        local.onError = function (error, trace) {
            /*
                this function will run the main error-handler
                http://phantomjs.org/api/phantom/handler/on-error.html
            */
            var data;
            // handle notification that url has been opened
            if (error === 'success' && !trace) {
                console.log(local.utility2.argv0 + ' - opened ' + local.utility2.url);
                error = null;
                // screen-capture webpage after timeoutScreenCapture ms
                if (local.utility2.modePhantom === 'screenCapture') {
                    setTimeout(function () {
                        // save screen-capture
                        local.page.render(local.utility2.fileScreenCapture);
                        console.log(local.utility2.argv0 +
                            ' - created screen-capture file://' +
                            local.utility2.fileScreenCapture);
                        local.coverAndExit(local.global.__coverage__, local.utility2.exit, 0);
                    }, local.utility2.timeoutScreenCapture);
                }
                return;
            }
            // parse global_test_results
            try {
                data = JSON.parse(
                    (/\nphantom\n(\{"global_test_results":\{[\S\s]+)/).exec(error)[1]
                ).global_test_results;
            } catch (ignore) {
            }
            if (data && data.testReport) {
                // handle global_test_results thrown from webpage
                // merge coverage
                local.global.__coverage__ =
                    local.utility2.istanbulMerge(local.global.__coverage__, data.coverage);
                // merge test-report
                local.utility2.testMerge(local.utility2.testReport, data.testReport);
                // save screen-capture
                local.page.render(local.utility2.fileScreenCapture);
                // integrate screen-capture into test-report
                data.testReport.testPlatformList[0].screenCaptureImg =
                    local.utility2.fileScreenCapture.replace((/[\S\s]*\//), '');
                // save test-report
                local.fs.write(
                    local.utility2.fileTestReport,
                    JSON.stringify(local.utility2.testReport)
                );
                // run phantom self-test
                if (local.utility2.modePhantomSelfTest) {
                    // coverage-hack - cover no coverage handling behavior
                    local.coverAndExit(null, local.utility2.nop);
                    // disable exit
                    local.utility2.exit = local.utility2.nop;
                    // test string error with no trace handling behavior
                    local.onError('error', null);
                    // test string error
                    // with trace-function and trace-sourceUrl handling behavior
                    local.onError('error', [{ function: true, sourceUrl: true }]);
                    // test default error handling behavior
                    local.onError(local.utility2.errorDefault);
                    // restore exit
                    local.utility2.exit = local.global.phantom.exit;
                }
                local.coverAndExit(
                    local.global.__coverage__,
                    local.utility2.exit,
                    data.testReport.testsFailed
                );
                return;
            }
            // handle webpage error - http://phantomjs.org/api/phantom/handler/on-error.html
            if (typeof error === 'string') {
                console.error('\n' + local.utility2.testName + '\nERROR: ' + error + ' TRACE:');
                (trace || []).forEach(function (t) {
                    console.error(' -> ' + (t.file || t.sourceURL)
                        + ': ' + t.line + (t.function
                        ? ' (in function ' + t.function + ')'
                        : ''));
                });
                console.error();
            // handle default error
            } else {
                local.utility2.onErrorDefault(error);
            }
            if (local.utility2.modePhantom !== 'screenCapture') {
                local.coverAndExit(local.global.__coverage__, local.utility2.exit, 1);
            }
        };

        [
            {
                // coverage-hack - cover 'hello' test
                system: { args: ['', 'hello'] },
                global: { console: { log: local.utility2.nop } },
                utility2: { exit: local.utility2.nop }
            },
            local
        ].forEach(function (local) {
            // run 'hello' test
            if (local.system.args[1] === 'hello') {
                local.global.console.log('hello');
                local.utility2.exit();
                return;
            }
            // init global error handling
            // http://phantomjs.org/api/phantom/handler/on-error.html
            local.global.phantom.onError = local.onError;
            // override utility2 properties
            local.utility2.objectSetOverride(
                local.utility2,
                JSON.parse(decodeURIComponent(local.system.args[1])),
                -1
            );
            // if modeErrorIgnore is truthy, then suppress console.error and console.log
            if (local.utility2.modeErrorIgnore) {
                console.error = console.log = local.utility2.nop;
            }
            // init timerTimeout
            local.timerTimeout = local.utility2.onTimeout(
                local.utility2.onErrorExit,
                local.utility2.timeoutDefault,
                local.utility2.url
            );
            // init webpage
            local.page = local.webpage.create();
            // init webpage clipRect
            local.page.clipRect = { height: 768, left: 0, top: 0, width: 1024 };
            // init webpage viewportSize
            local.page.viewportSize = { height: 768, width: 1024 };
            // init webpage error handling
            // http://phantomjs.org/api/webpage/handler/on-error.html
            local.page.onError = local.onError;
            // pipe webpage console.log to stdout
            local.page.onConsoleMessage = function () {
                console.log.apply(console, arguments);
            };
            // open requested webpage
            local.page.open(
                // security - insert _testSecret in url without revealing it
                local.utility2.url.replace('{{_testSecret}}', local.utility2._testSecret),
                local.onError
            );
        });
        break;
    }
}((function (self) {
    'use strict';
    var local;



    // run shared js-env code
    (function () {
        // init local
        local = {};
        local.modeJs = (function () {
            try {
                return self.phantom.version &&
                    typeof require('webpage').create === 'function' &&
                    'phantom';
            } catch (errorCaughtPhantom) {
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
            }
        }());
        // init global
        local.global = local.modeJs === 'browser'
            ? window
            : local.modeJs === 'node'
            ? global
            : self;
        // init global debug_print
        local.global['debug_print'.replace('_p', 'P')] = function (arg) {
            /*
                this function will both print the arg to stderr and return it
            */
            // debug arguments
            local['_debug_printArguments'.replace('_p', 'P')] = arguments;
            console.error('\n\n\ndebug_print'.replace('_p', 'P'));
            console.error.apply(console, arguments);
            console.error();
            // return arg for inspection
            return arg;
        };
        local.nop = function () {
            /*
                this function will run no operation - nop
            */
            return;
        };
        // init utility2
        local.utility2 = { local: local, nop: local.nop };
    }());
    switch (local.modeJs) {



    // run browser js-env code
    case 'browser':
        // export utility2
        window.utility2 = local.utility2;
        // require modules
        local.istanbul_lite = window.istanbul_lite;
        local.jslint_lite = window.jslint_lite;
        // init utility2 properties
        local.utility2.envDict = local.utility2.envDict || {};
        local.utility2.exit = local.utility2.nop;
        break;



    // run node js-env code
    case 'node':
        // export utility2
        module.exports = local.utility2;
        // require modules
        local.child_process = require('child_process');
        local.fs = require('fs');
        local.http = require('http');
        local.https = require('https');
        local.istanbul_lite = require('istanbul-lite');
        local.jslint_lite = require('jslint-lite');
        local.path = require('path');
        local.url = require('url');
        local.zlib = require('zlib');
        // init utility2 properties
        local.utility2.__dirname = __dirname;
        local.utility2.envDict = process.env;
        local.utility2.envDict.npm_config_dir_build = process.cwd() + '/tmp/build';
        local.utility2.envDict.npm_config_dir_tmp = process.cwd() + '/tmp';
        local.utility2.exit = process.exit;
        break;



    // run phantom js-env code
    case 'phantom':
        // export utility2
        self.utility2 = local.utility2;
        // require modules
        local.fs = require('fs');
        local.system = require('system');
        local.webpage = require('webpage');
        // init utility2 properties
        local.utility2.envDict = local.system.env;
        local.utility2.exit = self.phantom.exit;
        break;
    }



    // run shared js-env code
    (function () {



/* jslint-indent-begin 8 */
/*jslint maxlen: 256*/
// init assets
local.utility2['/assets/utility2.css'] = String() +
    '/*csslint\n' +
        'box-model: false\n' +
    '*/\n' +
    '.ajaxProgressBarDiv {\n' +
        'animation: 2s linear 0s normal none infinite ajaxProgressBarDivAnimation;\n' +
        '-o-animation: 2s linear 0s normal none infinite ajaxProgressBarDivAnimation;\n' +
        '-moz-animation: 2s linear 0s normal none infinite ajaxProgressBarDivAnimation;\n' +
        '-webkit-animation: 2s linear 0s normal none infinite ajaxProgressBarDivAnimation;\n' +
        'background-image: linear-gradient(\n' +
            '45deg,rgba(255,255,255,.25) 25%,\n' +
            'transparent 25%,\n' +
            'transparent 50%,\n' +
            'rgba(255,255,255,.25) 50%,\n' +
            'rgba(255,255,255,.25) 75%,\n' +
            'transparent 75%,\n' +
            'transparent\n' +
        ');\n' +
        'background-size: 40px 40px;\n' +
        'color: #fff;\n' +
        'font-family: Helvetical Neue, Helvetica, Arial, sans-serif;\n' +
        'font-size: 12px;\n' +
        'padding: 2px 0 2px 0;\n' +
        'text-align: center;\n' +
        'transition: width .5s ease;\n' +
        'width: 25%;\n' +
    '}\n' +
    '.ajaxProgressBarDivError {\n' +
        'background-color: #d33;\n' +
    '}\n' +
    '.ajaxProgressBarDivLoading {\n' +
        'background-color: #37b;\n' +
    '}\n' +
    '.ajaxProgressBarDivSuccess {\n' +
        'background-color: #3b3;\n' +
    '}\n' +
    '.ajaxProgressDiv {\n' +
        'background-color: #fff;\n' +
        'border: 1px solid;\n' +
        'display: none;\n' +
        'left: 50%;\n' +
        'margin: 0 0 0 -50px;\n' +
        'padding: 5px 5px 5px 5px;\n' +
        'position: fixed;\n' +
        'top: 49%;\n' +
        'width: 100px;\n' +
        'z-index: 9999;\n' +
    '}\n' +
    '@keyframes ajaxProgressBarDivAnimation {\n' +
        'from { background-position: 40px 0; }\n' +
        'to { background-position: 0 0; }\n' +
    '}\n' +
    '@-o-keyframes ajaxProgressBarDivAnimation {\n' +
        'from { background-position: 40px 0; }\n' +
        'to { background-position: 0 0; }\n' +
    '}\n' +
    '@-webkit-keyframes ajaxProgressBarDivAnimation {\n' +
        'from { background-position: 40px 0; }\n' +
        'to { background-position: 0 0; }\n' +
    '}\n' +
    String();



/* jslint-ignore-begin */
// https://img.shields.io/badge/last_build-0000_00_00_00_00_00_UTC_--_master_--_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-0077ff.svg?style=flat
local.utility2['/build/build.badge.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" width="563" height="20"><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><rect rx="0" width="563" height="20" fill="#555"/><rect rx="0" x="61" width="502" height="20" fill="#07f"/><path fill="#07f" d="M61 0h4v20h-4z"/><rect rx="0" width="563" height="20" fill="url(#a)"/><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="31.5" y="15" fill="#010101" fill-opacity=".3">last build</text><text x="31.5" y="14">last build</text><text x="311" y="15" fill="#010101" fill-opacity=".3">0000 00 00 00 00 00 UTC - master - aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</text><text x="311" y="14">0000 00 00 00 00 00 UTC - master - aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</text></g></svg>';



// https://img.shields.io/badge/coverage-100.0%-00dd00.svg?style=flat
local.utility2['/build/coverage.badge.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" width="117" height="20"><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><rect rx="0" width="117" height="20" fill="#555"/><rect rx="0" x="63" width="54" height="20" fill="#0d0"/><path fill="#0d0" d="M63 0h4v20h-4z"/><rect rx="0" width="117" height="20" fill="url(#a)"/><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="32.5" y="15" fill="#010101" fill-opacity=".3">coverage</text><text x="32.5" y="14">coverage</text><text x="89" y="15" fill="#010101" fill-opacity=".3">100.0%</text><text x="89" y="14">100.0%</text></g></svg>';



// https://img.shields.io/badge/tests_failed-999-dd0000.svg?style=flat
local.utility2['/build/test-report.badge.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" width="103" height="20"><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><rect rx="0" width="103" height="20" fill="#555"/><rect rx="0" x="72" width="31" height="20" fill="#d00"/><path fill="#d00" d="M72 0h4v20h-4z"/><rect rx="0" width="103" height="20" fill="url(#a)"/><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="37" y="15" fill="#010101" fill-opacity=".3">tests failed</text><text x="37" y="14">tests failed</text><text x="86.5" y="15" fill="#010101" fill-opacity=".3">999</text><text x="86.5" y="14">999</text></g></svg>';
/* jslint-ignore-end */



local.utility2['/test/test-report.html.template'] = String() +
    '<style>\n' +
    '.testReportPlatformDiv {\n' +
        'border: 1px solid;\n' +
        'border-radius: 5px;\n' +
        'font-family: Helvetical Neue, Helvetica, Arial, sans-serif;\n' +
        'margin-top: 20px;\n' +
        'padding: 0 10px 10px 10px;\n' +
        'text-align: left;\n' +
    '}\n' +
    '.testReportPlatformPre {\n' +
        'background-color: #fdd;\n' +
        'border: 1px;\n' +
        'border-radius: 0 0 5px 5px;\n' +
        'border-top-style: solid;\n' +
        'margin-bottom: 0;\n' +
        'padding: 10px;\n' +
    '}\n' +
    '.testReportPlatformPreHidden {\n' +
        'display: none;\n' +
    '}\n' +
    '.testReportPlatformScreenCaptureImg {\n' +
        'border: 1px solid;\n' +
        'border-color: #000;\n' +
        'display:block;\n' +
        'margin: 5px 0 5px 0;\n' +
        'max-height:256px;\n' +
        'max-width:512px;\n' +
    '}\n' +
    '.testReportPlatformSpan {\n' +
        'display: inline-block;\n' +
        'width: 8em;\n' +
    '}\n' +
    '.testReportPlatformTable {\n' +
        'border: 1px;\n' +
        'border-top-style: solid;\n' +
        'text-align: left;\n' +
        'width: 100%;\n' +
    '}\n' +
    '.testReportSummaryDiv {\n' +
        'background-color: #bfb;\n' +
    '}\n' +
    '.testReportSummarySpan {\n' +
        'display: inline-block;\n' +
        'width: 6.5em;\n' +
    '}\n' +
    'tr:nth-child(odd).testReportPlatformTr {\n' +
        'background-color: #bfb;\n' +
    '}\n' +
    '.testReportTestFailed {\n' +
        'background-color: #f99;\n' +
    '}\n' +
    '.testReportTestPending {\n' +
        'background-color: #99f;\n' +
    '}\n' +
    '</style>\n' +
    '<div class="testReportPlatformDiv testReportSummaryDiv">\n' +
    '<h2>{{envDict.npm_package_name}} test-report summary</h2>\n' +
    '<h4>\n' +
        '<span class="testReportSummarySpan">version</span>-\n' +
            '{{envDict.npm_package_version}}<br>\n' +
        '<span class="testReportSummarySpan">test date</span>- {{date}}<br>\n' +
        '<span class="testReportSummarySpan">commit info</span>- {{CI_COMMIT_INFO}}<br>\n' +
    '</h4>\n' +
    '<table class="testReportPlatformTable">\n' +
    '<thead><tr>\n' +
        '<th>total time elapsed</th>\n' +
        '<th>total tests failed</th>\n' +
        '<th>total tests passed</th>\n' +
        '<th>total tests pending</th>\n' +
    '</tr></thead>\n' +
    '<tbody><tr>\n' +
        '<td>{{timeElapsed}} ms</td>\n' +
        '<td class="{{testsFailedClass}}">{{testsFailed}}</td>\n' +
        '<td>{{testsPassed}}</td>\n' +
        '<td>{{testsPending}}</td>\n' +
    '</tr></tbody>\n' +
    '</table>\n' +
    '</div>\n' +
    '{{#testPlatformList}}\n' +
    '<div class="testReportPlatformDiv">\n' +
    '<h4>\n' +
        '{{testPlatformNumber}}. {{name}}<br>\n' +
        '{{screenCapture}}\n' +
        '<span class="testReportPlatformSpan">time elapsed</span>- {{timeElapsed}} ms<br>\n' +
        '<span class="testReportPlatformSpan">tests failed</span>- {{testsFailed}}<br>\n' +
        '<span class="testReportPlatformSpan">tests passed</span>- {{testsPassed}}<br>\n' +
        '<span class="testReportPlatformSpan">tests pending</span>- {{testsPending}}<br>\n' +
    '</h4>\n' +
    '<table class="testReportPlatformTable">\n' +
    '<thead><tr>\n' +
        '<th>#</th>\n' +
        '<th>time elapsed</th>\n' +
        '<th>status</th>\n' +
        '<th>test case</th>\n' +
    '</tr></thead>\n' +
    '<tbody>\n' +
    '{{#testCaseList}}\n' +
    '<tr class="testReportPlatformTr">\n' +
        '<td>{{testCaseNumber}}</td>\n' +
        '<td>{{timeElapsed}} ms</td>\n' +
        '<td class="{{testReportTestStatusClass}}">{{status}}</td>\n' +
        '<td>{{name}}</td>\n' +
    '</tr>\n' +
    '{{/testCaseList}}\n' +
    '</tbody>\n' +
    '</table>\n' +
    '<pre class="{{testReportPlatformPreClass}}">\n' +
    '{{#errorStackList}}\n' +
    '{{errorStack}}\n' +
    '{{/errorStackList}}\n' +
    '</pre>\n' +
    '</div>\n' +
    '{{/testPlatformList}}\n' +
    String();
/* jslint-indent-end */



    }());
    return local;
}(this))));
