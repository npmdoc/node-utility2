///usr/bin/env node
/* istanbul instrument in package istanbul */
/*jslint
    bitwise: true,
    browser: true,
    maxerr: 8,
    maxlen: 96,
    node: true,
    nomen: true,
    regexp: true,
    stupid: true
*/
(function (local) {
    'use strict';
    var __dirname, process, require;



    // run shared js-env code - pre-init
    (function () {
        // jslint-hack
        local.nop(__dirname);
        __dirname = '';
        /* istanbul ignore next */
        local.global.__coverageCodeDict__ = local.global.__coverageCodeDict__ || {};
        local['./package.json'] = {};
        process = local.modeJs === 'browser'
            ? {
                cwd: function () {
                    return '';
                },
                stdout: {}
            }
            : local.process;
        require = function (key) {
            try {
                return local[key] || local.require(key);
            } catch (ignore) {
            }
        };
    }());



    // run shared js-env code - function
    (function () {
        local.coverageMerge = function (coverage1, coverage2) {
        /*
         * this function will merge coverage2 into coverage1
         */
            var dict1, dict2;
            coverage1 = coverage1 || {};
            coverage2 = coverage2 || {};
            Object.keys(coverage2).forEach(function (file) {
                if (!coverage2[file]) {
                    return;
                }
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
                                dict1[key][ii] += count;
                            });
                        });
                        break;
                    // increment coverage for function and statement lines
                    case 'f':
                    case 's':
                        Object.keys(dict2).forEach(function (key) {
                            dict1[key] += dict2[key];
                        });
                        break;
                    }
                });
            });
            return coverage1;
        };

        local.coverageReportCreate = function () {
        /*
         * this function will
         * 1. print coverage in text-format to stdout
         * 2. write coverage in html-format to filesystem
         * 3. return coverage in html-format as single document
         */
            var options;
            /* istanbul ignore next */
            if (!local.global.__coverage__) {
                return '';
            }
            options = {};
            options.dir = process.cwd() + '/tmp/build/coverage.html';
            // merge previous coverage
            if (local.modeJs === 'node' && process.env.npm_config_mode_coverage_merge) {
                console.log('merging file://' + options.dir + '/coverage.json to coverage');
                try {
                    local.coverageMerge(
                        local.global.__coverage__,
                        JSON.parse(
                            local._fs.readFileSync(options.dir + '/coverage.json', 'utf8')
                        )
                    );
                } catch (ignore) {
                }
                try {
                    options.coverageCodeDict = JSON.parse(local._fs.readFileSync(
                        options.dir + '/coverage.code-dict.json',
                        'utf8'
                    ));
                    Object.keys(options.coverageCodeDict).forEach(function (key) {
                        local.global.__coverageCodeDict__[key] =
                            local.global.__coverageCodeDict__[key] ||
                            options.coverageCodeDict[key];
                    });
                } catch (ignore) {
                }
            }
            // init writer
            local.coverageReportHtml = '';
            local.coverageReportHtml += '<div class="coverageReportDiv">\n' +
                '<h1>coverage-report</h1>\n' +
                '<div ' +
                'style="background: #fff; border: 1px solid #000; margin 0; padding: 0;">\n';
            local.writerData = '';
            options.sourceStore = {};
            options.writer = local.writer;
            // 1. print coverage in text-format to stdout
            new local.TextReport(options).writeReport(local.collector);
            // 2. write coverage in html-format to filesystem
            new local.HtmlReport(options).writeReport(local.collector);
            local.writer.writeFile('', local.nop);
            // write coverage.json
            local.fsWriteFileWithMkdirpSync2(
                options.dir + '/coverage.json',
                JSON.stringify(local.global.__coverage__)
            );
            // write coverage.code-dict.json
            local.fsWriteFileWithMkdirpSync2(
                options.dir + '/coverage.code-dict.json',
                JSON.stringify(local.global.__coverageCodeDict__)
            );
            // write coverage.badge.svg
            options.pct = local.coverageReportSummary.root.metrics.lines.pct;
            local.fsWriteFileWithMkdirpSync2(
                local.path.dirname(options.dir) + '/coverage.badge.svg',
                local.templateCoverageBadgeSvg
                    // edit coverage badge percent
                    .replace((/100.0/g), options.pct)
                    // edit coverage badge color
                    .replace(
                        (/0d0/g),
                        ('0' + Math.round((100 - options.pct) * 2.21).toString(16)).slice(-2) +
                            ('0' + Math.round(options.pct * 2.21).toString(16)).slice(-2) + '00'
                    )
            );
            console.log('created coverage file://' + options.dir + '/index.html');
            // 3. return coverage in html-format as a single document
            local.coverageReportHtml += '</div>\n</div>\n';
            // write coverage.rollup.html
            local.fsWriteFileWithMkdirpSync2(
                options.dir + '/coverage.rollup.html',
                local.coverageReportHtml
            );
            return local.coverageReportHtml;
        };

        local.fs = {};

        local.fs.readFileSync = function (file) {
            // return head.txt or foot.txt
            file = local[file.slice(-8)];
            if (local.modeJs === 'browser') {
                file = file
                    .replace((/\bhtml\b/g), 'x-istanbul-html')
                    .replace((/<style>[\S\s]+?<\/style>/), function (match0) {
                        return match0
                            .replace((/\S.*?\{/g), function (match0) {
                                return 'x-istanbul-html ' + match0
                                    .replace((/,/g), ', x-istanbul-html ');
                            });
                    })
                    .replace('position: fixed;', 'position: static;')
                    .replace('margin-top: 170px;', 'margin-top: 10px;');
            }
            if (local.modeJs === 'node' && process.env.npm_package_homepage) {
                file = file
                    .replace('{{env.npm_package_homepage}}', process.env.npm_package_homepage)
                    .replace('{{env.npm_package_name}}', process.env.npm_package_name)
                    .replace('{{env.npm_package_version}}', process.env.npm_package_version);
            } else {
                file = file.replace((/<h1 [\S\s]*<\/h1>/), '<h1>&nbsp;</h1>');
            }
            return file;
        };

        local.fs.readdirSync = function () {
            return [];
        };

        /* istanbul ignore next */
        local.instrumentInPackage = function (code, file) {
        /*
         * this function will instrument the code
         * only if the macro /\* istanbul instrument in package $npm_package_nameAlias *\/
         * exists in the code
         */
            return process.env.npm_config_mode_coverage &&
                code.indexOf('/* istanbul ignore all */\n') < 0 && (
                    process.env.npm_config_mode_coverage === 'all' ||
                    code.indexOf('/* istanbul instrument in package ' +
                            process.env.npm_package_nameAlias + ' */\n') >= 0 ||
                    code.indexOf('/* istanbul instrument in package ' +
                            process.env.npm_config_mode_coverage + ' */\n') >= 0
                )
                ? local.instrumentSync(code, file)
                : code;
        };

        local.instrumentSync = function (code, file) {
        /*
         * this function will
         * 1. normalize the file
         * 2. save code to __coverageCodeDict__[file] for future html-report
         * 3. return instrumented code
         */
            // 1. normalize the file
            file = local.path.resolve('/', file);
            // 2. save code to __coverageCodeDict__[file] for future html-report
            local.global.__coverageCodeDict__[file] = code;
            // 3. return instrumented code
            return new local.Instrumenter({
                embedSource: true,
                noAutoWrap: true
            }).instrumentSync(code, file).trimLeft();
        };
        local.util = { inherits: local.nop };
    }());
    switch (local.modeJs) {



    // run browser js-env code - pre-init
    case 'browser':
        // require modules
        local.path = {
            dirname: function (file) {
                return file.replace((/\/[\w\-\.]+?$/), '');
            },
            resolve: function () {
                return arguments[arguments.length - 1];
            }
        };
        break;



    // run node js-env code - pre-init
    case 'node':
        // require modules
        local._fs = local.require('fs');
        local.module = require('module');
        local.path = local.require('path');
        break;
    }



/* istanbul ignore next */
// init lib esprima
/* jslint-ignore-begin */
// https://github.com/jquery/esprima/blob/2.5.0/esprima.js
// utility2-uglifyjs https://raw.githubusercontent.com/jquery/esprima/2.5.0/esprima.js
(function () { var exports; exports = local.esprima = {};
(function(e,t){"use strict";typeof define=="function"&&define.amd?define(["exports"
],t):typeof exports!="undefined"?t(exports):t(e.esprima={})})(this,function(e){"use strict"
;function A(e,t){if(!e)throw new Error("ASSERT: "+t)}function O(e){return e>=48&&
e<=57}function M(e){return"0123456789abcdefABCDEF".indexOf(e)>=0}function _(e){return"01234567"
.indexOf(e)>=0}function D(e){var t=e!=="0",n="01234567".indexOf(e);return c<S&&_
(a[c])&&(t=!0,n=n*8+"01234567".indexOf(a[c++]),"0123".indexOf(e)>=0&&c<S&&_(a[c]
)&&(n=n*8+"01234567".indexOf(a[c++]))),{code:n,octal:t}}function P(e){return e===32||
e===9||e===11||e===12||e===160||e>=5760&&[5760,6158,8192,8193,8194,8195,8196,8197
,8198,8199,8200,8201,8202,8239,8287,12288,65279].indexOf(e)>=0}function H(e){return e===10||
e===13||e===8232||e===8233}function B(e){return e<65536?String.fromCharCode(e):String
.fromCharCode(55296+(e-65536>>10))+String.fromCharCode(56320+(e-65536&1023))}function j
(e){return e===36||e===95||e>=65&&e<=90||e>=97&&e<=122||e===92||e>=128&&u.NonAsciiIdentifierStart
.test(B(e))}function F(e){return e===36||e===95||e>=65&&e<=90||e>=97&&e<=122||e>=48&&
e<=57||e===92||e>=128&&u.NonAsciiIdentifierPart.test(B(e))}function I(e){switch(
e){case"enum":case"export":case"import":case"super":return!0;default:return!1}}function q
(e){switch(e){case"implements":case"interface":case"package":case"private":case"protected"
:case"public":case"static":case"yield":case"let":return!0;default:return!1}}function R
(e){return e==="eval"||e==="arguments"}function U(e){switch(e.length){case 2:return e==="if"||
e==="in"||e==="do";case 3:return e==="var"||e==="for"||e==="new"||e==="try"||e==="let"
;case 4:return e==="this"||e==="else"||e==="case"||e==="void"||e==="with"||e==="enum"
;case 5:return e==="while"||e==="break"||e==="catch"||e==="throw"||e==="const"||
e==="yield"||e==="class"||e==="super";case 6:return e==="return"||e==="typeof"||
e==="delete"||e==="switch"||e==="export"||e==="import";case 7:return e==="default"||
e==="finally"||e==="extends";case 8:return e==="function"||e==="continue"||e==="debugger"
;case 10:return e==="instanceof";default:return!1}}function z(e,t,n,r,i){var s;A
(typeof n=="number","Comment must have valid position"),T.lastCommentStart=n,s={
type:e,value:t},N.range&&(s.range=[n,r]),N.loc&&(s.loc=i),N.comments.push(s),N.attachComment&&
(N.leadingComments.push(s),N.trailingComments.push(s))}function W(e){var t,n,r,i
;t=c-e,n={start:{line:h,column:c-p-e}};while(c<S){r=a.charCodeAt(c),++c;if(H(r))
{d=!0,N.comments&&(i=a.slice(t+e,c-1),n.end={line:h,column:c-p-1},z("Line",i,t,c-1
,n)),r===13&&a.charCodeAt(c)===10&&++c,++h,p=c;return}}N.comments&&(i=a.slice(t+
e,c),n.end={line:h,column:c-p},z("Line",i,t,c,n))}function X(){var e,t,n,r;N.comments&&
(e=c-2,t={start:{line:h,column:c-p-2}});while(c<S){n=a.charCodeAt(c);if(H(n))n===13&&
a.charCodeAt(c+1)===10&&++c,d=!0,++h,++c,p=c;else if(n===42){if(a.charCodeAt(c+1
)===47){++c,++c,N.comments&&(r=a.slice(e+2,c-2),t.end={line:h,column:c-p},z("Block"
,r,e,c,t));return}++c}else++c}N.comments&&(t.end={line:h,column:c-p},r=a.slice(e+2
,c),z("Block",r,e,c,t)),At()}function V(){var e,t;d=!1,t=c===0;while(c<S){e=a.charCodeAt
(c);if(P(e))++c;else if(H(e))d=!0,++c,e===13&&a.charCodeAt(c)===10&&++c,++h,p=c,
t=!0;else if(e===47){e=a.charCodeAt(c+1);if(e===47)++c,++c,W(2),t=!0;else{if(e!==42
)break;++c,++c,X()}}else if(t&&e===45){if(a.charCodeAt(c+1)!==45||a.charCodeAt(c+2
)!==62)break;c+=3,W(3)}else{if(e!==60)break;if(a.slice(c+1,c+4)!=="!--")break;++
c,++c,++c,++c,W(4)}}}function $(e){var t,n,r,i=0;n=e==="u"?4:2;for(t=0;t<n;++t){
if(!(c<S&&M(a[c])))return"";r=a[c++],i=i*16+"0123456789abcdef".indexOf(r.toLowerCase
())}return String.fromCharCode(i)}function J(){var e,t;e=a[c],t=0,e==="}"&&Lt();
while(c<S){e=a[c++];if(!M(e))break;t=t*16+"0123456789abcdef".indexOf(e.toLowerCase
())}return(t>1114111||e!=="}")&&Lt(),B(t)}function K(e){var t,n,r;return t=a.charCodeAt
(e),t>=55296&&t<=56319&&(r=a.charCodeAt(e+1),r>=56320&&r<=57343&&(n=t,t=(n-55296
)*1024+r-56320+65536)),t}function Q(){var e,t,n;e=K(c),n=B(e),c+=n.length,e===92&&
(a.charCodeAt(c)!==117&&Lt(),++c,a[c]==="{"?(++c,t=J()):(t=$("u"),e=t.charCodeAt
(0),(!t||t==="\\"||!j(e))&&Lt()),n=t);while(c<S){e=K(c);if(!F(e))break;t=B(e),n+=
t,c+=t.length,e===92&&(n=n.substr(0,n.length-1),a.charCodeAt(c)!==117&&Lt(),++c,
a[c]==="{"?(++c,t=J()):(t=$("u"),e=t.charCodeAt(0),(!t||t==="\\"||!F(e))&&Lt()),
n+=t)}return n}function G(){var e,t;e=c++;while(c<S){t=a.charCodeAt(c);if(t===92
)return c=e,Q();if(t>=55296&&t<57343)return c=e,Q();if(!F(t))break;++c}return a.
slice(e,c)}function Y(){var e,n,r;return e=c,n=a.charCodeAt(c)===92?Q():G(),n.length===1?
r=t.Identifier:U(n)?r=t.Keyword:n==="null"?r=t.NullLiteral:n==="true"||n==="false"?
r=t.BooleanLiteral:r=t.Identifier,{type:r,value:n,lineNumber:h,lineStart:p,start
:e,end:c}}function Z(){var e,n;e={type:t.Punctuator,value:"",lineNumber:h,lineStart
:p,start:c,end:c},n=a[c];switch(n){case"(":N.tokenize&&(N.openParenToken=N.tokens
.length),++c;break;case"{":N.tokenize&&(N.openCurlyToken=N.tokens.length),T.curlyStack
.push("{"),++c;break;case".":++c,a[c]==="."&&a[c+1]==="."&&(c+=2,n="...");break;
case"}":++c,T.curlyStack.pop();break;case")":case";":case",":case"[":case"]":case":"
:case"?":case"~":++c;break;default:n=a.substr(c,4),n===">>>="?c+=4:(n=n.substr(0
,3),n==="==="||n==="!=="||n===">>>"||n==="<<="||n===">>="?c+=3:(n=n.substr(0,2),
n==="&&"||n==="||"||n==="=="||n==="!="||n==="+="||n==="-="||n==="*="||n==="/="||
n==="++"||n==="--"||n==="<<"||n===">>"||n==="&="||n==="|="||n==="^="||n==="%="||
n==="<="||n===">="||n==="=>"?c+=2:(n=a[c],"<>=!+-*%&|^/".indexOf(n)>=0&&++c)))}return c===
e.start&&Lt(),e.end=c,e.value=n,e}function et(e){var n="";while(c<S){if(!M(a[c])
)break;n+=a[c++]}return n.length===0&&Lt(),j(a.charCodeAt(c))&&Lt(),{type:t.NumericLiteral
,value:parseInt("0x"+n,16),lineNumber:h,lineStart:p,start:e,end:c}}function tt(e
){var n,r;r="";while(c<S){n=a[c];if(n!=="0"&&n!=="1")break;r+=a[c++]}return r.length===0&&
Lt(),c<S&&(n=a.charCodeAt(c),(j(n)||O(n))&&Lt()),{type:t.NumericLiteral,value:parseInt
(r,2),lineNumber:h,lineStart:p,start:e,end:c}}function nt(e,n){var r,i;_(e)?(i=!0
,r="0"+a[c++]):(i=!1,++c,r="");while(c<S){if(!_(a[c]))break;r+=a[c++]}return!i&&
r.length===0&&Lt(),(j(a.charCodeAt(c))||O(a.charCodeAt(c)))&&Lt(),{type:t.NumericLiteral
,value:parseInt(r,8),octal:i,lineNumber:h,lineStart:p,start:n,end:c}}function rt
(){var e,t;for(e=c+1;e<S;++e){t=a[e];if(t==="8"||t==="9")return!1;if(!_(t))return!0
}return!0}function it(){var e,n,r;r=a[c],A(O(r.charCodeAt(0))||r===".","Numeric literal must start with a decimal digit or a decimal point"
),n=c,e="";if(r!=="."){e=a[c++],r=a[c];if(e==="0"){if(r==="x"||r==="X")return++c
,et(n);if(r==="b"||r==="B")return++c,tt(n);if(r==="o"||r==="O")return nt(r,n);if(
_(r)&&rt())return nt(r,n)}while(O(a.charCodeAt(c)))e+=a[c++];r=a[c]}if(r==="."){
e+=a[c++];while(O(a.charCodeAt(c)))e+=a[c++];r=a[c]}if(r==="e"||r==="E"){e+=a[c++
],r=a[c];if(r==="+"||r==="-")e+=a[c++];if(O(a.charCodeAt(c)))while(O(a.charCodeAt
(c)))e+=a[c++];else Lt()}return j(a.charCodeAt(c))&&Lt(),{type:t.NumericLiteral,
value:parseFloat(e),lineNumber:h,lineStart:p,start:n,end:c}}function st(){var e=""
,n,r,i,s,o,u=!1;n=a[c],A(n==="'"||n==='"',"String literal must starts with a quote"
),r=c,++c;while(c<S){i=a[c++];if(i===n){n="";break}if(i==="\\"){i=a[c++];if(!i||!
H(i.charCodeAt(0)))switch(i){case"u":case"x":if(a[c]==="{")++c,e+=J();else{s=$(i
);if(!s)throw Lt();e+=s}break;case"n":e+="\n";break;case"r":e+="\r";break;case"t"
:e+="	";break;case"b":e+="\b";break;case"f":e+="\f";break;case"v":e+="";break;case"8"
:case"9":e+=i,At();break;default:_(i)?(o=D(i),u=o.octal||u,e+=String.fromCharCode
(o.code)):e+=i}else++h,i==="\r"&&a[c]==="\n"&&++c,p=c}else{if(H(i.charCodeAt(0))
)break;e+=i}}return n!==""&&Lt(),{type:t.StringLiteral,value:e,octal:u,lineNumber
:b,lineStart:w,start:r,end:c}}function ot(){var e="",n,r,i,s,u,f,l,d;s=!1,f=!1,r=
c,u=a[c]==="`",i=2,++c;while(c<S){n=a[c++];if(n==="`"){i=1,f=!0,s=!0;break}if(n==="$"
){if(a[c]==="{"){T.curlyStack.push("${"),++c,s=!0;break}e+=n}else if(n==="\\"){n=
a[c++];if(!H(n.charCodeAt(0)))switch(n){case"n":e+="\n";break;case"r":e+="\r";break;
case"t":e+="	";break;case"u":case"x":a[c]==="{"?(++c,e+=J()):(l=c,d=$(n),d?e+=d:
(c=l,e+=n));break;case"b":e+="\b";break;case"f":e+="\f";break;case"v":e+="";break;
default:n==="0"?(O(a.charCodeAt(c))&&Nt(o.TemplateOctalLiteral),e+="\0"):_(n)?Nt
(o.TemplateOctalLiteral):e+=n}else++h,n==="\r"&&a[c]==="\n"&&++c,p=c}else H(n.charCodeAt
(0))?(++h,n==="\r"&&a[c]==="\n"&&++c,p=c,e+="\n"):e+=n}return s||Lt(),u||T.curlyStack
.pop(),{type:t.Template,value:{cooked:e,raw:a.slice(r+1,c-i)},head:u,tail:f,lineNumber
:h,lineStart:p,start:r,end:c}}function ut(e,t){var n="\uffff",r=e;t.indexOf("u")>=0&&
(r=r.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([a-fA-F0-9]{4})/g,function(e,t,r){var i=
parseInt(t||r,16);return i>1114111&&Lt(null,o.InvalidRegExp),i<=65535?String.fromCharCode
(i):n}).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g,n));try{RegExp(r)}catch(i){Lt(
null,o.InvalidRegExp)}try{return new RegExp(e,t)}catch(s){return null}}function at
(){var e,t,n,r,i;e=a[c],A(e==="/","Regular expression literal must start with a slash"
),t=a[c++],n=!1,r=!1;while(c<S){e=a[c++],t+=e;if(e==="\\")e=a[c++],H(e.charCodeAt
(0))&&Lt(null,o.UnterminatedRegExp),t+=e;else if(H(e.charCodeAt(0)))Lt(null,o.UnterminatedRegExp
);else if(n)e==="]"&&(n=!1);else{if(e==="/"){r=!0;break}e==="["&&(n=!0)}}return r||
Lt(null,o.UnterminatedRegExp),i=t.substr(1,t.length-2),{value:i,literal:t}}function ft
(){var e,t,n,r;t="",n="";while(c<S){e=a[c];if(!F(e.charCodeAt(0)))break;++c;if(e==="\\"&&
c<S){e=a[c];if(e==="u"){++c,r=c,e=$("u");if(e){n+=e;for(t+="\\u";r<c;++r)t+=a[r]
}else c=r,n+="u",t+="\\u";At()}else t+="\\",At()}else n+=e,t+=e}return{value:n,literal
:t}}function lt(){E=!0;var e,n,r,i;return x=null,V(),e=c,n=at(),r=ft(),i=ut(n.value
,r.value),E=!1,N.tokenize?{type:t.RegularExpression,value:i,regex:{pattern:n.value
,flags:r.value},lineNumber:h,lineStart:p,start:e,end:c}:{literal:n.literal+r.literal
,value:i,regex:{pattern:n.value,flags:r.value},start:e,end:c}}function ct(){var e
,t,n,r;return V(),e=c,t={start:{line:h,column:c-p}},n=lt(),t.end={line:h,column:
c-p},N.tokenize||(N.tokens.length>0&&(r=N.tokens[N.tokens.length-1],r.range[0]===
e&&r.type==="Punctuator"&&(r.value==="/"||r.value==="/=")&&N.tokens.pop()),N.tokens
.push({type:"RegularExpression",value:n.literal,regex:n.regex,range:[e,c],loc:t}
)),n}function ht(e){return e.type===t.Identifier||e.type===t.Keyword||e.type===t
.BooleanLiteral||e.type===t.NullLiteral}function pt(){var e,t;e=N.tokens[N.tokens
.length-1];if(!e)return ct();if(e.type==="Punctuator"){if(e.value==="]")return Z
();if(e.value===")")return t=N.tokens[N.openParenToken-1],!t||t.type!=="Keyword"||
t.value!=="if"&&t.value!=="while"&&t.value!=="for"&&t.value!=="with"?Z():ct();if(
e.value==="}"){if(N.tokens[N.openCurlyToken-3]&&N.tokens[N.openCurlyToken-3].type==="Keyword"
){t=N.tokens[N.openCurlyToken-4];if(!t)return Z()}else{if(!N.tokens[N.openCurlyToken-4
]||N.tokens[N.openCurlyToken-4].type!=="Keyword")return Z();t=N.tokens[N.openCurlyToken-5
];if(!t)return ct()}return r.indexOf(t.value)>=0?Z():ct()}return ct()}return e.type==="Keyword"&&
e.value!=="this"?ct():Z()}function dt(){var e,n;if(c>=S)return{type:t.EOF,lineNumber
:h,lineStart:p,start:c,end:c};e=a.charCodeAt(c);if(j(e))return n=Y(),f&&q(n.value
)&&(n.type=t.Keyword),n;if(e===40||e===41||e===59)return Z();if(e===39||e===34)return st
();if(e===46)return O(a.charCodeAt(c+1))?it():Z();if(O(e))return it();if(N.tokenize&&
e===47)return pt();if(e===96||e===125&&T.curlyStack[T.curlyStack.length-1]==="${"
)return ot();if(e>=55296&&e<57343){e=K(c);if(j(e))return Y()}return Z()}function vt
(){var e,r,i,s;return e={start:{line:h,column:c-p}},r=dt(),e.end={line:h,column:
c-p},r.type!==t.EOF&&(i=a.slice(r.start,r.end),s={type:n[r.type],value:i,range:[
r.start,r.end],loc:e},r.regex&&(s.regex={pattern:r.regex.pattern,flags:r.regex.flags
}),N.tokens.push(s)),r}function mt(){var e;return E=!0,v=c,m=h,g=p,V(),e=x,y=c,b=
h,w=p,x=typeof N.tokens!="undefined"?vt():dt(),E=!1,e}function gt(){E=!0,V(),v=c
,m=h,g=p,y=c,b=h,w=p,x=typeof N.tokens!="undefined"?vt():dt(),E=!1}function yt()
{this.line=b,this.column=y-w}function bt(){this.start=new yt,this.end=null}function wt
(e){this.start={line:e.lineNumber,column:e.start-e.lineStart},this.end=null}function Et
(){N.range&&(this.range=[y,0]),N.loc&&(this.loc=new bt)}function St(e){N.range&&
(this.range=[e.start,0]),N.loc&&(this.loc=new wt(e))}function xt(e){var t,n;for(
t=0;t<N.errors.length;t++){n=N.errors[t];if(n.index===e.index&&n.message===e.message
)return}N.errors.push(e)}function Tt(e,t,n){var r=new Error("Line "+e+": "+n);return r
.index=t,r.lineNumber=e,r.column=t-(E?p:g)+1,r.description=n,r}function Nt(e){var t
,n;throw t=Array.prototype.slice.call(arguments,1),n=e.replace(/%(\d)/g,function(
e,n){return A(n<t.length,"Message reference must be in range"),t[n]}),Tt(m,v,n)}
function Ct(e){var t,n,r;t=Array.prototype.slice.call(arguments,1),n=e.replace(/%(\d)/g
,function(e,n){return A(n<t.length,"Message reference must be in range"),t[n]}),
r=Tt(h,v,n);if(!N.errors)throw r;xt(r)}function kt(e,n){var r,i=n||o.UnexpectedToken
;return e?(n||(i=e.type===t.EOF?o.UnexpectedEOS:e.type===t.Identifier?o.UnexpectedIdentifier
:e.type===t.NumericLiteral?o.UnexpectedNumber:e.type===t.StringLiteral?o.UnexpectedString
:e.type===t.Template?o.UnexpectedTemplate:o.UnexpectedToken,e.type===t.Keyword&&
(I(e.value)?i=o.UnexpectedReserved:f&&q(e.value)&&(i=o.StrictReservedWord))),r=e
.type===t.Template?e.value.raw:e.value):r="ILLEGAL",i=i.replace("%0",r),e&&typeof
e.lineNumber=="number"?Tt(e.lineNumber,e.start,i):Tt(E?h:m,E?c:v,i)}function Lt(
e,t){throw kt(e,t)}function At(e,t){var n=kt(e,t);if(!N.errors)throw n;xt(n)}function Ot
(e){var n=mt();(n.type!==t.Punctuator||n.value!==e)&&Lt(n)}function Mt(){var e;N
.errors?(e=x,e.type===t.Punctuator&&e.value===","?mt():e.type===t.Punctuator&&e.
value===";"?(mt(),At(e)):At(e,o.UnexpectedToken)):Ot(",")}function _t(e){var n=mt
();(n.type!==t.Keyword||n.value!==e)&&Lt(n)}function Dt(e){return x.type===t.Punctuator&&
x.value===e}function Pt(e){return x.type===t.Keyword&&x.value===e}function Ht(e)
{return x.type===t.Identifier&&x.value===e}function Bt(){var e;return x.type!==t
.Punctuator?!1:(e=x.value,e==="="||e==="*="||e==="/="||e==="%="||e==="+="||e==="-="||
e==="<<="||e===">>="||e===">>>="||e==="&="||e==="^="||e==="|=")}function jt(){if(
a.charCodeAt(y)===59||Dt(";")){mt();return}if(d)return;v=y,m=b,g=w,x.type!==t.EOF&&!
Dt("}")&&Lt(x)}function Ft(e){var t=C,n=k,r=L,i;return C=!0,k=!0,L=null,i=e(),L!==
null&&Lt(L),C=t,k=n,L=r,i}function It(e){var t=C,n=k,r=L,i;return C=!0,k=!0,L=null
,i=e(),C=C&&t,k=k&&n,L=r||L,i}function qt(e){var t=new Et,n=[],r,i;Ot("[");while(!
Dt("]"))if(Dt(","))mt(),n.push(null);else{if(Dt("...")){i=new Et,mt(),e.push(x),
r=kn(e),n.push(i.finishRestElement(r));break}n.push(Wt(e)),Dt("]")||Ot(",")}return Ot
("]"),t.finishArrayPattern(n)}function Rt(e){var n=new Et,r,i,s=Dt("["),o;if(x.type===
t.Identifier){i=x,r=kn();if(Dt("="))return e.push(i),mt(),o=Sn(),n.finishProperty
("init",r,!1,(new St(i)).finishAssignmentPattern(r,o),!1,!1);if(!Dt(":"))return e
.push(i),n.finishProperty("init",r,!1,r,!1,!0)}else r=Jt(e);return Ot(":"),o=Wt(
e),n.finishProperty("init",r,s,o,!1,!1)}function Ut(e){var t=new Et,n=[];Ot("{")
;while(!Dt("}"))n.push(Rt(e)),Dt("}")||Ot(",");return mt(),t.finishObjectPattern
(n)}function zt(e){return Dt("[")?qt(e):Dt("{")?Ut(e):(e.push(x),kn())}function Wt
(e){var t=x,n,r,i;return n=zt(e),Dt("=")&&(mt(),r=T.allowYield,T.allowYield=!0,i=
Ft(Sn),T.allowYield=r,n=(new St(t)).finishAssignmentPattern(n,i)),n}function Xt(
){var e=[],t=new Et,n;Ot("[");while(!Dt("]"))Dt(",")?(mt(),e.push(null)):Dt("..."
)?(n=new Et,mt(),n.finishSpreadElement(It(Sn)),Dt("]")||(k=C=!1,Ot(",")),e.push(
n)):(e.push(It(Sn)),Dt("]")||Ot(","));return mt(),t.finishArrayExpression(e)}function Vt
(e,t,n){var r,i;return k=C=!1,r=f,i=Ft(Yn),f&&t.firstRestricted&&At(t.firstRestricted
,t.message),f&&t.stricted&&At(t.stricted,t.message),f=r,e.finishFunctionExpression
(null,t.params,t.defaults,i,n)}function $t(){var e,t,n=new Et,r=T.allowYield;return T
.allowYield=!1,e=tr(),T.allowYield=r,T.allowYield=!1,t=Vt(n,e,!1),T.allowYield=r
,t}function Jt(){var e,n=new Et,r;e=mt();switch(e.type){case t.StringLiteral:case t
.NumericLiteral:return f&&e.octal&&At(e,o.StrictOctalLiteral),n.finishLiteral(e)
;case t.Identifier:case t.BooleanLiteral:case t.NullLiteral:case t.Keyword:return n
.finishIdentifier(e.value);case t.Punctuator:if(e.value==="[")return r=Ft(Sn),Ot
("]"),r}Lt(e)}function Kt(){switch(x.type){case t.Identifier:case t.StringLiteral
:case t.BooleanLiteral:case t.NullLiteral:case t.NumericLiteral:case t.Keyword:return!0
;case t.Punctuator:return x.value==="["}return!1}function Qt(e,n,r,i){var s,o,u,
a,f=T.allowYield;if(e.type===t.Identifier){if(e.value==="get"&&Kt())return r=Dt("["
),n=Jt(),u=new Et,Ot("("),Ot(")"),T.allowYield=!1,s=Vt(u,{params:[],defaults:[],
stricted:null,firstRestricted:null,message:null},!1),T.allowYield=f,i.finishProperty
("get",n,r,s,!1,!1);if(e.value==="set"&&Kt())return r=Dt("["),n=Jt(),u=new Et,Ot
("("),o={params:[],defaultCount:0,defaults:[],firstRestricted:null,paramSet:{}},
Dt(")")?At(x):(T.allowYield=!1,er(o),T.allowYield=f,o.defaultCount===0&&(o.defaults=
[])),Ot(")"),T.allowYield=!1,s=Vt(u,o,!1),T.allowYield=f,i.finishProperty("set",
n,r,s,!1,!1)}else if(e.type===t.Punctuator&&e.value==="*"&&Kt())return r=Dt("[")
,n=Jt(),u=new Et,T.allowYield=!0,a=tr(),T.allowYield=f,T.allowYield=!1,s=Vt(u,a,!0
),T.allowYield=f,i.finishProperty("init",n,r,s,!0,!1);return n&&Dt("(")?(s=$t(),
i.finishProperty("init",n,r,s,!0,!1)):null}function Gt(e){var n=x,r=new Et,s,u,a
,f,l;s=Dt("["),Dt("*")?mt():u=Jt(),a=Qt(n,u,s,r);if(a)return a;u||Lt(x),s||(f=u.
type===i.Identifier&&u.name==="__proto__"||u.type===i.Literal&&u.value==="__proto__"
,e.value&&f&&Ct(o.DuplicateProtoProperty),e.value|=f);if(Dt(":"))return mt(),l=It
(Sn),r.finishProperty("init",u,s,l,!1,!1);if(n.type===t.Identifier)return Dt("="
)?(L=x,mt(),l=Ft(Sn),r.finishProperty("init",u,s,(new St(n)).finishAssignmentPattern
(u,l),!1,!0)):r.finishProperty("init",u,s,u,!1,!0);Lt(x)}function Yt(){var e=[],
t={value:!1},n=new Et;Ot("{");while(!Dt("}"))e.push(Gt(t)),Dt("}")||Mt();return Ot
("}"),n.finishObjectExpression(e)}function Zt(e){var t;switch(e.type){case i.Identifier
:case i.MemberExpression:case i.RestElement:case i.AssignmentPattern:break;case i
.SpreadElement:e.type=i.RestElement,Zt(e.argument);break;case i.ArrayExpression:
e.type=i.ArrayPattern;for(t=0;t<e.elements.length;t++)e.elements[t]!==null&&Zt(e
.elements[t]);break;case i.ObjectExpression:e.type=i.ObjectPattern;for(t=0;t<e.properties
.length;t++)Zt(e.properties[t].value);break;case i.AssignmentExpression:e.type=i
.AssignmentPattern,Zt(e.left);break;default:}}function en(e){var n,r;return(x.type!==
t.Template||e.head&&!x.head)&&Lt(),n=new Et,r=mt(),n.finishTemplateElement({raw:
r.value.raw,cooked:r.value.cooked},r.tail)}function tn(){var e,t,n,r=new Et;e=en
({head:!0}),t=[e],n=[];while(!e.tail)n.push(xn()),e=en({head:!1}),t.push(e);return r
.finishTemplateLiteral(t,n)}function nn(){var e,t,n,r,o=[];Ot("(");if(Dt(")"))return mt
(),Dt("=>")||Ot("=>"),{type:s.ArrowParameterPlaceHolder,params:[],rawParams:[]};
n=x;if(Dt("..."))return e=Pn(o),Ot(")"),Dt("=>")||Ot("=>"),{type:s.ArrowParameterPlaceHolder
,params:[e]};C=!0,e=It(Sn);if(Dt(",")){k=!1,t=[e];while(y<S){if(!Dt(","))break;mt
();if(Dt("...")){C||Lt(x),t.push(Pn(o)),Ot(")"),Dt("=>")||Ot("=>"),C=!1;for(r=0;
r<t.length;r++)Zt(t[r]);return{type:s.ArrowParameterPlaceHolder,params:t}}t.push
(It(Sn))}e=(new St(n)).finishSequenceExpression(t)}Ot(")");if(Dt("=>")){if(e.type===
i.Identifier&&e.name==="yield")return{type:s.ArrowParameterPlaceHolder,params:[e
]};C||Lt(x);if(e.type===i.SequenceExpression)for(r=0;r<e.expressions.length;r++)
Zt(e.expressions[r]);else Zt(e);e={type:s.ArrowParameterPlaceHolder,params:e.type===
i.SequenceExpression?e.expressions:[e]}}return C=!1,e}function rn(){var e,n,r,i;
if(Dt("("))return C=!1,It(nn);if(Dt("["))return It(Xt);if(Dt("{"))return It(Yt);
e=x.type,i=new Et;if(e===t.Identifier)l==="module"&&x.value==="await"&&At(x),r=i
.finishIdentifier(mt().value);else if(e===t.StringLiteral||e===t.NumericLiteral)
k=C=!1,f&&x.octal&&At(x,o.StrictOctalLiteral),r=i.finishLiteral(mt());else if(e===
t.Keyword){if(!f&&T.allowYield&&Pt("yield"))return on();k=C=!1;if(Pt("function")
)return rr();if(Pt("this"))return mt(),i.finishThisExpression();if(Pt("class"))return or
();Lt(mt())}else e===t.BooleanLiteral?(k=C=!1,n=mt(),n.value=n.value==="true",r=
i.finishLiteral(n)):e===t.NullLiteral?(k=C=!1,n=mt(),n.value=null,r=i.finishLiteral
(n)):Dt("/")||Dt("/=")?(k=C=!1,c=y,typeof N.tokens!="undefined"?n=ct():n=lt(),mt
(),r=i.finishLiteral(n)):e===t.Template?r=tn():Lt(mt());return r}function sn(){var e=
[],t;Ot("(");if(!Dt(")"))while(y<S){Dt("...")?(t=new Et,mt(),t.finishSpreadElement
(Ft(Sn))):t=Ft(Sn),e.push(t);if(Dt(")"))break;Mt()}return Ot(")"),e}function on(
){var e,t=new Et;return e=mt(),ht(e)||Lt(e),t.finishIdentifier(e.value)}function un
(){return Ot("."),on()}function an(){var e;return Ot("["),e=Ft(xn),Ot("]"),e}function fn
(){var e,n,r=new Et;_t("new");if(Dt(".")){mt();if(x.type===t.Identifier&&x.value==="target"&&
T.inFunctionBody)return mt(),r.finishMetaProperty("new","target");Lt(x)}return e=
Ft(cn),n=Dt("(")?sn():[],k=C=!1,r.finishNewExpression(e,n)}function ln(){var e,n
,r,i,s,o=T.allowIn;s=x,T.allowIn=!0,Pt("super")&&T.inFunctionBody?(n=new Et,mt()
,n=n.finishSuper(),!Dt("(")&&!Dt(".")&&!Dt("[")&&Lt(x)):n=It(Pt("new")?fn:rn);for(
;;)if(Dt("."))C=!1,k=!0,i=un(),n=(new St(s)).finishMemberExpression(".",n,i);else if(
Dt("("))C=!1,k=!1,r=sn(),n=(new St(s)).finishCallExpression(n,r);else if(Dt("[")
)C=!1,k=!0,i=an(),n=(new St(s)).finishMemberExpression("[",n,i);else{if(x.type!==
t.Template||!x.head)break;e=tn(),n=(new St(s)).finishTaggedTemplateExpression(n,
e)}return T.allowIn=o,n}function cn(){var e,n,r,i;A(T.allowIn,"callee of new expression always allow in keyword."
),i=x,Pt("super")&&T.inFunctionBody?(n=new Et,mt(),n=n.finishSuper(),!Dt("[")&&!
Dt(".")&&Lt(x)):n=It(Pt("new")?fn:rn);for(;;)if(Dt("["))C=!1,k=!0,r=an(),n=(new
St(i)).finishMemberExpression("[",n,r);else if(Dt("."))C=!1,k=!0,r=un(),n=(new St
(i)).finishMemberExpression(".",n,r);else{if(x.type!==t.Template||!x.head)break;
e=tn(),n=(new St(i)).finishTaggedTemplateExpression(n,e)}return n}function hn(){
var e,n,r=x;return e=It(ln),!d&&x.type===t.Punctuator&&(Dt("++")||Dt("--"))&&(f&&
e.type===i.Identifier&&R(e.name)&&Ct(o.StrictLHSPostfix),k||Ct(o.InvalidLHSInAssignment
),k=C=!1,n=mt(),e=(new St(r)).finishPostfixExpression(n.value,e)),e}function pn(
){var e,n,r;return x.type!==t.Punctuator&&x.type!==t.Keyword?n=hn():Dt("++")||Dt
("--")?(r=x,e=mt(),n=It(pn),f&&n.type===i.Identifier&&R(n.name)&&Ct(o.StrictLHSPrefix
),k||Ct(o.InvalidLHSInAssignment),n=(new St(r)).finishUnaryExpression(e.value,n)
,k=C=!1):Dt("+")||Dt("-")||Dt("~")||Dt("!")?(r=x,e=mt(),n=It(pn),n=(new St(r)).finishUnaryExpression
(e.value,n),k=C=!1):Pt("delete")||Pt("void")||Pt("typeof")?(r=x,e=mt(),n=It(pn),
n=(new St(r)).finishUnaryExpression(e.value,n),f&&n.operator==="delete"&&n.argument
.type===i.Identifier&&Ct(o.StrictDelete),k=C=!1):n=hn(),n}function dn(e,n){var r=0
;if(e.type!==t.Punctuator&&e.type!==t.Keyword)return 0;switch(e.value){case"||":
r=1;break;case"&&":r=2;break;case"|":r=3;break;case"^":r=4;break;case"&":r=5;break;
case"==":case"!=":case"===":case"!==":r=6;break;case"<":case">":case"<=":case">="
:case"instanceof":r=7;break;case"in":r=n?7:0;break;case"<<":case">>":case">>>":r=8
;break;case"+":case"-":r=9;break;case"*":case"/":case"%":r=11;break;default:}return r
}function vn(){var e,t,n,r,i,s,o,u,a,f;e=x,a=It(pn),r=x,i=dn(r,T.allowIn);if(i===0
)return a;k=C=!1,r.prec=i,mt(),t=[e,x],o=Ft(pn),s=[a,r,o];while((i=dn(x,T.allowIn
))>0){while(s.length>2&&i<=s[s.length-2].prec)o=s.pop(),u=s.pop().value,a=s.pop(
),t.pop(),n=(new St(t[t.length-1])).finishBinaryExpression(u,a,o),s.push(n);r=mt
(),r.prec=i,s.push(r),t.push(x),n=Ft(pn),s.push(n)}f=s.length-1,n=s[f],t.pop();while(
f>1)n=(new St(t.pop())).finishBinaryExpression(s[f-1].value,s[f-2],n),f-=2;return n
}function mn(){var e,t,n,r,i;return i=x,e=It(vn),Dt("?")&&(mt(),t=T.allowIn,T.allowIn=!0
,n=Ft(Sn),T.allowIn=t,Ot(":"),r=Ft(Sn),e=(new St(i)).finishConditionalExpression
(e,n,r),k=C=!1),e}function gn(){return Dt("{")?Yn():Ft(Sn)}function yn(e,t){var n
;switch(t.type){case i.Identifier:Zn(e,t,t.name);break;case i.RestElement:yn(e,t
.argument);break;case i.AssignmentPattern:yn(e,t.left);break;case i.ArrayPattern
:for(n=0;n<t.elements.length;n++)t.elements[n]!==null&&yn(e,t.elements[n]);break;
case i.YieldExpression:break;default:A(t.type===i.ObjectPattern,"Invalid type");
for(n=0;n<t.properties.length;n++)yn(e,t.properties[n].value)}}function bn(e){var t
,n,r,u,a,l,c,h;a=[],l=0,u=[e];switch(e.type){case i.Identifier:break;case s.ArrowParameterPlaceHolder
:u=e.params;break;default:return null}c={paramSet:{}};for(t=0,n=u.length;t<n;t+=1
){r=u[t];switch(r.type){case i.AssignmentPattern:u[t]=r.left,r.right.type===i.YieldExpression&&
(r.right.argument&&Lt(x),r.right.type=i.Identifier,r.right.name="yield",delete r
.right.argument,delete r.right.delegate),a.push(r.right),++l,yn(c,r.left);break;
default:yn(c,r),u[t]=r,a.push(null)}}if(f||!T.allowYield)for(t=0,n=u.length;t<n;
t+=1)r=u[t],r.type===i.YieldExpression&&Lt(x);return c.message===o.StrictParamDupe&&
(h=f?c.stricted:c.firstRestricted,Lt(h,c.message)),l===0&&(a=[]),{params:u,defaults
:a,stricted:c.stricted,firstRestricted:c.firstRestricted,message:c.message}}function wn
(e,t){var n,r,s;return d&&At(x),Ot("=>"),n=f,r=T.allowYield,T.allowYield=!0,s=gn
(),f&&e.firstRestricted&&Lt(e.firstRestricted,e.message),f&&e.stricted&&At(e.stricted
,e.message),f=n,T.allowYield=r,t.finishArrowFunctionExpression(e.params,e.defaults
,s,s.type!==i.BlockStatement)}function En(){var e,n,r,i;return e=null,n=new Et,_t
("yield"),d||(i=T.allowYield,T.allowYield=!1,r=Dt("*"),r?(mt(),e=Sn()):!Dt(";")&&!
Dt("}")&&!Dt(")")&&x.type!==t.EOF&&(e=Sn()),T.allowYield=i),n.finishYieldExpression
(e,r)}function Sn(){var e,t,n,r,u;return u=x,e=x,!T.allowYield&&Pt("yield")?En()
:(t=mn(),t.type===s.ArrowParameterPlaceHolder||Dt("=>")?(k=C=!1,r=bn(t),r?(L=null
,wn(r,new St(u))):t):(Bt()&&(k||Ct(o.InvalidLHSInAssignment),f&&t.type===i.Identifier&&
R(t.name)&&At(e,o.StrictLHSAssignment),Dt("=")?Zt(t):k=C=!1,e=mt(),n=Ft(Sn),t=(new
St(u)).finishAssignmentExpression(e.value,t,n),L=null),t))}function xn(){var e,t=
x,n;e=Ft(Sn);if(Dt(",")){n=[e];while(y<S){if(!Dt(","))break;mt(),n.push(Ft(Sn))}
e=(new St(t)).finishSequenceExpression(n)}return e}function Tn(){if(x.type===t.Keyword
)switch(x.value){case"export":return l!=="module"&&At(x,o.IllegalExportDeclaration
),hr();case"import":return l!=="module"&&At(x,o.IllegalImportDeclaration),gr();case"const"
:case"let":return Dn({inFor:!1});case"function":return nr(new Et);case"class":return sr
()}return Gn()}function Nn(){var e=[];while(y<S){if(Dt("}"))break;e.push(Tn())}return e
}function Cn(){var e,t=new Et;return Ot("{"),e=Nn(),Ot("}"),t.finishBlockStatement
(e)}function kn(){var e,n=new Et;return e=mt(),e.type===t.Keyword&&e.value==="yield"?
(f&&At(e,o.StrictReservedWord),T.allowYield||Lt(e)):e.type!==t.Identifier?f&&e.type===
t.Keyword&&q(e.value)?At(e,o.StrictReservedWord):Lt(e):l==="module"&&e.type===t.
Identifier&&e.value==="await"&&At(e),n.finishIdentifier(e.value)}function Ln(){var e=
null,t,n=new Et,r=[];return t=zt(r),f&&R(t.name)&&Ct(o.StrictVarName),Dt("=")?(mt
(),e=Ft(Sn)):t.type!==i.Identifier&&Ot("="),n.finishVariableDeclarator(t,e)}function An
(){var e=[];do{e.push(Ln());if(!Dt(","))break;mt()}while(y<S);return e}function On
(e){var t;return _t("var"),t=An(),jt(),e.finishVariableDeclaration(t)}function Mn
(e,t){var n=null,r,s=new Et,u=[];r=zt(u),f&&r.type===i.Identifier&&R(r.name)&&Ct
(o.StrictVarName);if(e==="const")!Pt("in")&&!Ht("of")&&(Ot("="),n=Ft(Sn));else if(!
t.inFor&&r.type!==i.Identifier||Dt("="))Ot("="),n=Ft(Sn);return s.finishVariableDeclarator
(r,n)}function _n(e,t){var n=[];do{n.push(Mn(e,t));if(!Dt(","))break;mt()}while(
y<S);return n}function Dn(e){var t,n,r=new Et;return t=mt().value,A(t==="let"||t==="const"
,"Lexical declaration must be either let or const"),n=_n(t,e),jt(),r.finishLexicalDeclaration
(n,t)}function Pn(e){var t,n=new Et;return mt(),Dt("{")&&Nt(o.ObjectPatternAsRestParameter
),e.push(x),t=kn(),Dt("=")&&Nt(o.DefaultRestParameter),Dt(")")||Nt(o.ParameterAfterRestParameter
),n.finishRestElement(t)}function Hn(e){return Ot(";"),e.finishEmptyStatement()}
function Bn(e){var t=xn();return jt(),e.finishExpressionStatement(t)}function jn
(e){var t,n,r;return _t("if"),Ot("("),t=xn(),Ot(")"),n=Gn(),Pt("else")?(mt(),r=Gn
()):r=null,e.finishIfStatement(t,n,r)}function Fn(e){var t,n,r;return _t("do"),r=
T.inIteration,T.inIteration=!0,t=Gn(),T.inIteration=r,_t("while"),Ot("("),n=xn()
,Ot(")"),Dt(";")&&mt(),e.finishDoWhileStatement(t,n)}function In(e){var t,n,r;return _t
("while"),Ot("("),t=xn(),Ot(")"),r=T.inIteration,T.inIteration=!0,n=Gn(),T.inIteration=
r,e.finishWhileStatement(t,n)}function qn(e){var t,n,r,i,s,u,a,f,l,c,h,p,d=T.allowIn
;t=s=u=null,n=!0,_t("for"),Ot("(");if(Dt(";"))mt();else if(Pt("var"))t=new Et,mt
(),T.allowIn=!1,t=t.finishVariableDeclaration(An()),T.allowIn=d,t.declarations.length===1&&
Pt("in")?(mt(),a=t,f=xn(),t=null):t.declarations.length===1&&t.declarations[0].init===
null&&Ht("of")?(mt(),a=t,f=Sn(),t=null,n=!1):Ot(";");else if(Pt("const")||Pt("let"
))t=new Et,l=mt().value,T.allowIn=!1,c=_n(l,{inFor:!0}),T.allowIn=d,c.length===1&&
c[0].init===null&&Pt("in")?(t=t.finishLexicalDeclaration(c,l),mt(),a=t,f=xn(),t=
null):c.length===1&&c[0].init===null&&Ht("of")?(t=t.finishLexicalDeclaration(c,l
),mt(),a=t,f=Sn(),t=null,n=!1):(jt(),t=t.finishLexicalDeclaration(c,l));else{i=x
,T.allowIn=!1,t=It(Sn),T.allowIn=d;if(Pt("in"))k||Ct(o.InvalidLHSInForIn),mt(),Zt
(t),a=t,f=xn(),t=null;else if(Ht("of"))k||Ct(o.InvalidLHSInForLoop),mt(),Zt(t),a=
t,f=Sn(),t=null,n=!1;else{if(Dt(",")){r=[t];while(Dt(","))mt(),r.push(Ft(Sn));t=
(new St(i)).finishSequenceExpression(r)}Ot(";")}}return typeof a=="undefined"&&(
Dt(";")||(s=xn()),Ot(";"),Dt(")")||(u=xn())),Ot(")"),p=T.inIteration,T.inIteration=!0
,h=Ft(Gn),T.inIteration=p,typeof a=="undefined"?e.finishForStatement(t,s,u,h):n?
e.finishForInStatement(a,f,h):e.finishForOfStatement(a,f,h)}function Rn(e){var n=
null,r;return _t("continue"),a.charCodeAt(y)===59?(mt(),T.inIteration||Nt(o.IllegalContinue
),e.finishContinueStatement(null)):d?(T.inIteration||Nt(o.IllegalContinue),e.finishContinueStatement
(null)):(x.type===t.Identifier&&(n=kn(),r="$"+n.name,Object.prototype.hasOwnProperty
.call(T.labelSet,r)||Nt(o.UnknownLabel,n.name)),jt(),n===null&&!T.inIteration&&Nt
(o.IllegalContinue),e.finishContinueStatement(n))}function Un(e){var n=null,r;return _t
("break"),a.charCodeAt(v)===59?(mt(),!T.inIteration&&!T.inSwitch&&Nt(o.IllegalBreak
),e.finishBreakStatement(null)):d?(!T.inIteration&&!T.inSwitch&&Nt(o.IllegalBreak
),e.finishBreakStatement(null)):(x.type===t.Identifier&&(n=kn(),r="$"+n.name,Object
.prototype.hasOwnProperty.call(T.labelSet,r)||Nt(o.UnknownLabel,n.name)),jt(),n===
null&&!T.inIteration&&!T.inSwitch&&Nt(o.IllegalBreak),e.finishBreakStatement(n))
}function zn(e){var n=null;return _t("return"),T.inFunctionBody||Ct(o.IllegalReturn
),a.charCodeAt(v)===32&&j(a.charCodeAt(v+1))?(n=xn(),jt(),e.finishReturnStatement
(n)):d?e.finishReturnStatement(null):(Dt(";")||!Dt("}")&&x.type!==t.EOF&&(n=xn()
),jt(),e.finishReturnStatement(n))}function Wn(e){var t,n;return f&&Ct(o.StrictModeWith
),_t("with"),Ot("("),t=xn(),Ot(")"),n=Gn(),e.finishWithStatement(t,n)}function Xn
(){var e,t=[],n,r=new Et;Pt("default")?(mt(),e=null):(_t("case"),e=xn()),Ot(":")
;while(y<S){if(Dt("}")||Pt("default")||Pt("case"))break;n=Tn(),t.push(n)}return r
.finishSwitchCase(e,t)}function Vn(e){var t,n,r,i,s;_t("switch"),Ot("("),t=xn(),
Ot(")"),Ot("{"),n=[];if(Dt("}"))return mt(),e.finishSwitchStatement(t,n);i=T.inSwitch
,T.inSwitch=!0,s=!1;while(y<S){if(Dt("}"))break;r=Xn(),r.test===null&&(s&&Nt(o.MultipleDefaultsInSwitch
),s=!0),n.push(r)}return T.inSwitch=i,Ot("}"),e.finishSwitchStatement(t,n)}function $n
(e){var t;return _t("throw"),d&&Nt(o.NewlineAfterThrow),t=xn(),jt(),e.finishThrowStatement
(t)}function Jn(){var e,t=[],n={},r,i,s,u=new Et;_t("catch"),Ot("("),Dt(")")&&Lt
(x),e=zt(t);for(i=0;i<t.length;i++)r="$"+t[i].value,Object.prototype.hasOwnProperty
.call(n,r)&&Ct(o.DuplicateBinding,t[i].value),n[r]=!0;return f&&R(e.name)&&Ct(o.
StrictCatchVariable),Ot(")"),s=Cn(),u.finishCatchClause(e,s)}function Kn(e){var t
,n=null,r=null;return _t("try"),t=Cn(),Pt("catch")&&(n=Jn()),Pt("finally")&&(mt(
),r=Cn()),!n&&!r&&Nt(o.NoCatchOrFinally),e.finishTryStatement(t,n,r)}function Qn
(e){return _t("debugger"),jt(),e.finishDebuggerStatement()}function Gn(){var e=x
.type,n,r,s,u;e===t.EOF&&Lt(x);if(e===t.Punctuator&&x.value==="{")return Cn();k=
C=!0,u=new Et;if(e===t.Punctuator)switch(x.value){case";":return Hn(u);case"(":return Bn
(u);default:}else if(e===t.Keyword)switch(x.value){case"break":return Un(u);case"continue"
:return Rn(u);case"debugger":return Qn(u);case"do":return Fn(u);case"for":return qn
(u);case"function":return nr(u);case"if":return jn(u);case"return":return zn(u);
case"switch":return Vn(u);case"throw":return $n(u);case"try":return Kn(u);case"var"
:return On(u);case"while":return In(u);case"with":return Wn(u);default:}return n=
xn(),n.type===i.Identifier&&Dt(":")?(mt(),s="$"+n.name,Object.prototype.hasOwnProperty
.call(T.labelSet,s)&&Nt(o.Redeclaration,"Label",n.name),T.labelSet[s]=!0,r=Gn(),delete
T.labelSet[s],u.finishLabeledStatement(n,r)):(jt(),u.finishExpressionStatement(n
))}function Yn(){var e,n=[],r,s,u,l,c,h,p,d,v=new Et;Ot("{");while(y<S){if(x.type!==
t.StringLiteral)break;r=x,e=Tn(),n.push(e);if(e.expression.type!==i.Literal)break;
s=a.slice(r.start+1,r.end-1),s==="use strict"?(f=!0,u&&At(u,o.StrictOctalLiteral
)):!u&&r.octal&&(u=r)}l=T.labelSet,c=T.inIteration,h=T.inSwitch,p=T.inFunctionBody
,d=T.parenthesizedCount,T.labelSet={},T.inIteration=!1,T.inSwitch=!1,T.inFunctionBody=!0
,T.parenthesizedCount=0;while(y<S){if(Dt("}"))break;n.push(Tn())}return Ot("}"),
T.labelSet=l,T.inIteration=c,T.inSwitch=h,T.inFunctionBody=p,T.parenthesizedCount=
d,v.finishBlockStatement(n)}function Zn(e,t,n){var r="$"+n;f?(R(n)&&(e.stricted=
t,e.message=o.StrictParamName),Object.prototype.hasOwnProperty.call(e.paramSet,r
)&&(e.stricted=t,e.message=o.StrictParamDupe)):e.firstRestricted||(R(n)?(e.firstRestricted=
t,e.message=o.StrictParamName):q(n)?(e.firstRestricted=t,e.message=o.StrictReservedWord
):Object.prototype.hasOwnProperty.call(e.paramSet,r)&&(e.stricted=t,e.message=o.
StrictParamDupe)),e.paramSet[r]=!0}function er(e){var t,n,r=[],s,o;t=x;if(t.value==="..."
)return n=Pn(r),Zn(e,n.argument,n.argument.name),e.params.push(n),e.defaults.push
(null),!1;n=Wt(r);for(s=0;s<r.length;s++)Zn(e,r[s],r[s].value);return n.type===i
.AssignmentPattern&&(o=n.right,n=n.left,++e.defaultCount),e.params.push(n),e.defaults
.push(o),!Dt(")")}function tr(e){var t;t={params:[],defaultCount:0,defaults:[],firstRestricted
:e},Ot("(");if(!Dt(")")){t.paramSet={};while(y<S){if(!er(t))break;Ot(",")}}return Ot
(")"),t.defaultCount===0&&(t.defaults=[]),{params:t.params,defaults:t.defaults,stricted
:t.stricted,firstRestricted:t.firstRestricted,message:t.message}}function nr(e,t
){var n=null,r=[],i=[],s,u,a,l,c,h,p,d,v;v=T.allowYield,_t("function"),d=Dt("*")
,d&&mt();if(!t||!Dt("("))u=x,n=kn(),f?R(u.value)&&At(u,o.StrictFunctionName):R(u
.value)?(c=u,h=o.StrictFunctionName):q(u.value)&&(c=u,h=o.StrictReservedWord);return T
.allowYield=!d,l=tr(c),r=l.params,i=l.defaults,a=l.stricted,c=l.firstRestricted,
l.message&&(h=l.message),p=f,s=Yn(),f&&c&&Lt(c,h),f&&a&&At(a,h),f=p,T.allowYield=
v,e.finishFunctionDeclaration(n,r,i,s,d)}function rr(){var e,t=null,n,r,i,s,u=[]
,a=[],l,c,h=new Et,p,d;return d=T.allowYield,_t("function"),p=Dt("*"),p&&mt(),T.
allowYield=!p,Dt("(")||(e=x,t=!f&&!p&&Pt("yield")?on():kn(),f?R(e.value)&&At(e,o
.StrictFunctionName):R(e.value)?(r=e,i=o.StrictFunctionName):q(e.value)&&(r=e,i=
o.StrictReservedWord)),s=tr(r),u=s.params,a=s.defaults,n=s.stricted,r=s.firstRestricted
,s.message&&(i=s.message),c=f,l=Yn(),f&&r&&Lt(r,i),f&&n&&At(n,i),f=c,T.allowYield=
d,h.finishFunctionExpression(t,u,a,l,p)}function ir(){var e,t,n,r=!1,s,u,a,f;e=new
Et,Ot("{"),s=[];while(!Dt("}"))Dt(";")?mt():(u=new Et,t=x,n=!1,a=Dt("["),Dt("*")?
mt():(f=Jt(),f.name==="static"&&(Kt()||Dt("*"))&&(t=x,n=!0,a=Dt("["),Dt("*")?mt(
):f=Jt())),u=Qt(t,f,a,u),u?(u["static"]=n,u.kind==="init"&&(u.kind="method"),n?!
u.computed&&(u.key.name||u.key.value.toString())==="prototype"&&Lt(t,o.StaticPrototype
):!u.computed&&(u.key.name||u.key.value.toString())==="constructor"&&((u.kind!=="method"||!
u.method||u.value.generator)&&Lt(t,o.ConstructorSpecialMethod),r?Lt(t,o.DuplicateConstructor
):r=!0,u.kind="constructor"),u.type=i.MethodDefinition,delete u.method,delete u.
shorthand,s.push(u)):Lt(x));return mt(),e.finishClassBody(s)}function sr(e){var n=
null,r=null,i=new Et,s,o=f;f=!0,_t("class");if(!e||x.type===t.Identifier)n=kn();
return Pt("extends")&&(mt(),r=Ft(ln)),s=ir(),f=o,i.finishClassDeclaration(n,r,s)
}function or(){var e=null,n=null,r=new Et,i,s=f;return f=!0,_t("class"),x.type===
t.Identifier&&(e=kn()),Pt("extends")&&(mt(),n=Ft(ln)),i=ir(),f=s,r.finishClassExpression
(e,n,i)}function ur(){var e=new Et;return x.type!==t.StringLiteral&&Nt(o.InvalidModuleSpecifier
),e.finishLiteral(mt())}function ar(){var e,t,n=new Et,r;return Pt("default")?(r=new
Et,mt(),t=r.finishIdentifier("default")):t=kn(),Ht("as")&&(mt(),e=on()),n.finishExportSpecifier
(t,e)}function fr(e){var n=null,r,i=null,s=[];if(x.type===t.Keyword)switch(x.value
){case"let":case"const":case"var":case"class":case"function":return n=Tn(),e.finishExportNamedDeclaration
(n,s,null)}Ot("{");while(!Dt("}")){r=r||Pt("default"),s.push(ar());if(!Dt("}")){
Ot(",");if(Dt("}"))break}}return Ot("}"),Ht("from")?(mt(),i=ur(),jt()):r?Nt(x.value?
o.UnexpectedToken:o.MissingFromClause,x.value):jt(),e.finishExportNamedDeclaration
(n,s,i)}function lr(e){var t=null,n=null;return _t("default"),Pt("function")?(t=
nr(new Et,!0),e.finishExportDefaultDeclaration(t)):Pt("class")?(t=sr(!0),e.finishExportDefaultDeclaration
(t)):(Ht("from")&&Nt(o.UnexpectedToken,x.value),Dt("{")?n=Yt():Dt("[")?n=Xt():n=
Sn(),jt(),e.finishExportDefaultDeclaration(n))}function cr(e){var t;return Ot("*"
),Ht("from")||Nt(x.value?o.UnexpectedToken:o.MissingFromClause,x.value),mt(),t=ur
(),jt(),e.finishExportAllDeclaration(t)}function hr(){var e=new Et;return T.inFunctionBody&&
Nt(o.IllegalExportDeclaration),_t("export"),Pt("default")?lr(e):Dt("*")?cr(e):fr
(e)}function pr(){var e,t,n=new Et;return t=on(),Ht("as")&&(mt(),e=kn()),n.finishImportSpecifier
(e,t)}function dr(){var e=[];Ot("{");while(!Dt("}")){e.push(pr());if(!Dt("}")){Ot
(",");if(Dt("}"))break}}return Ot("}"),e}function vr(){var e,t=new Et;return e=on
(),t.finishImportDefaultSpecifier(e)}function mr(){var e,t=new Et;return Ot("*")
,Ht("as")||Nt(o.NoAsAfterImportNamespace),mt(),e=on(),t.finishImportNamespaceSpecifier
(e)}function gr(){var e=[],n,r=new Et;return T.inFunctionBody&&Nt(o.IllegalImportDeclaration
),_t("import"),x.type===t.StringLiteral?n=ur():(Dt("{")?e=e.concat(dr()):Dt("*")?
e.push(mr()):ht(x)&&!Pt("default")?(e.push(vr()),Dt(",")&&(mt(),Dt("*")?e.push(mr
()):Dt("{")?e=e.concat(dr()):Lt(x))):Lt(mt()),Ht("from")||Nt(x.value?o.UnexpectedToken
:o.MissingFromClause,x.value),mt(),n=ur()),jt(),r.finishImportDeclaration(e,n)}function yr
(){var e,n=[],r,s,u;while(y<S){r=x;if(r.type!==t.StringLiteral)break;e=Tn(),n.push
(e);if(e.expression.type!==i.Literal)break;s=a.slice(r.start+1,r.end-1),s==="use strict"?
(f=!0,u&&At(u,o.StrictOctalLiteral)):!u&&r.octal&&(u=r)}while(y<S){e=Tn();if(typeof
e=="undefined")break;n.push(e)}return n}function br(){var e,t;return gt(),t=new
Et,e=yr(),t.finishProgram(e)}function wr(){var e,t,n,r=[];for(e=0;e<N.tokens.length
;++e)t=N.tokens[e],n={type:t.type,value:t.value},t.regex&&(n.regex={pattern:t.regex
.pattern,flags:t.regex.flags}),N.range&&(n.range=t.range),N.loc&&(n.loc=t.loc),r
.push(n);N.tokens=r}function Er(e,n){var r,i;r=String,typeof e!="string"&&!(e instanceof
String)&&(e=r(e)),a=e,c=0,h=a.length>0?1:0,p=0,y=c,b=h,w=p,S=a.length,x=null,T={
allowIn:!0,allowYield:!0,labelSet:{},inFunctionBody:!1,inIteration:!1,inSwitch:!1
,lastCommentStart:-1,curlyStack:[]},N={},n=n||{},n.tokens=!0,N.tokens=[],N.tokenize=!0
,N.openParenToken=-1,N.openCurlyToken=-1,N.range=typeof n.range=="boolean"&&n.range
,N.loc=typeof n.loc=="boolean"&&n.loc,typeof n.comment=="boolean"&&n.comment&&(N
.comments=[]),typeof n.tolerant=="boolean"&&n.tolerant&&(N.errors=[]);try{gt();if(
x.type===t.EOF)return N.tokens;mt();while(x.type!==t.EOF)try{mt()}catch(s){if(N.
errors){xt(s);break}throw s}wr(),i=N.tokens,typeof N.comments!="undefined"&&(i.comments=
N.comments),typeof N.errors!="undefined"&&(i.errors=N.errors)}catch(o){throw o}finally{
N={}}return i}function Sr(e,t){var n,r;r=String,typeof e!="string"&&!(e instanceof
String)&&(e=r(e)),a=e,c=0,h=a.length>0?1:0,p=0,y=c,b=h,w=p,S=a.length,x=null,T={
allowIn:!0,allowYield:!0,labelSet:{},inFunctionBody:!1,inIteration:!1,inSwitch:!1
,lastCommentStart:-1,curlyStack:[]},l="script",f=!1,N={},typeof t!="undefined"&&
(N.range=typeof t.range=="boolean"&&t.range,N.loc=typeof t.loc=="boolean"&&t.loc
,N.attachComment=typeof t.attachComment=="boolean"&&t.attachComment,N.loc&&t.source!==
null&&t.source!==undefined&&(N.source=r(t.source)),typeof t.tokens=="boolean"&&t
.tokens&&(N.tokens=[]),typeof t.comment=="boolean"&&t.comment&&(N.comments=[]),typeof
t.tolerant=="boolean"&&t.tolerant&&(N.errors=[]),N.attachComment&&(N.range=!0,N.
comments=[],N.bottomRightStack=[],N.trailingComments=[],N.leadingComments=[]),t.
sourceType==="module"&&(l=t.sourceType,f=!0));try{n=br(),typeof N.comments!="undefined"&&
(n.comments=N.comments),typeof N.tokens!="undefined"&&(wr(),n.tokens=N.tokens),typeof
N.errors!="undefined"&&(n.errors=N.errors)}catch(i){throw i}finally{N={}}return n
}var t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C,k,L;t={BooleanLiteral:1
,EOF:2,Identifier:3,Keyword:4,NullLiteral:5,NumericLiteral:6,Punctuator:7,StringLiteral
:8,RegularExpression:9,Template:10},n={},n[t.BooleanLiteral]="Boolean",n[t.EOF]="<end>"
,n[t.Identifier]="Identifier",n[t.Keyword]="Keyword",n[t.NullLiteral]="Null",n[t
.NumericLiteral]="Numeric",n[t.Punctuator]="Punctuator",n[t.StringLiteral]="String"
,n[t.RegularExpression]="RegularExpression",n[t.Template]="Template",r=["(","{","["
,"in","typeof","instanceof","new","return","case","delete","throw","void","=","+="
,"-=","*=","/=","%=","<<=",">>=",">>>=","&=","|=","^=",",","+","-","*","/","%","++"
,"--","<<",">>",">>>","&","|","^","!","~","&&","||","?",":","===","==",">=","<="
,"<",">","!=","!=="],i={AssignmentExpression:"AssignmentExpression",AssignmentPattern
:"AssignmentPattern",ArrayExpression:"ArrayExpression",ArrayPattern:"ArrayPattern"
,ArrowFunctionExpression:"ArrowFunctionExpression",BlockStatement:"BlockStatement"
,BinaryExpression:"BinaryExpression",BreakStatement:"BreakStatement",CallExpression
:"CallExpression",CatchClause:"CatchClause",ClassBody:"ClassBody",ClassDeclaration
:"ClassDeclaration",ClassExpression:"ClassExpression",ConditionalExpression:"ConditionalExpression"
,ContinueStatement:"ContinueStatement",DoWhileStatement:"DoWhileStatement",DebuggerStatement
:"DebuggerStatement",EmptyStatement:"EmptyStatement",ExportAllDeclaration:"ExportAllDeclaration"
,ExportDefaultDeclaration:"ExportDefaultDeclaration",ExportNamedDeclaration:"ExportNamedDeclaration"
,ExportSpecifier:"ExportSpecifier",ExpressionStatement:"ExpressionStatement",ForStatement
:"ForStatement",ForOfStatement:"ForOfStatement",ForInStatement:"ForInStatement",
FunctionDeclaration:"FunctionDeclaration",FunctionExpression:"FunctionExpression"
,Identifier:"Identifier",IfStatement:"IfStatement",ImportDeclaration:"ImportDeclaration"
,ImportDefaultSpecifier:"ImportDefaultSpecifier",ImportNamespaceSpecifier:"ImportNamespaceSpecifier"
,ImportSpecifier:"ImportSpecifier",Literal:"Literal",LabeledStatement:"LabeledStatement"
,LogicalExpression:"LogicalExpression",MemberExpression:"MemberExpression",MetaProperty
:"MetaProperty",MethodDefinition:"MethodDefinition",NewExpression:"NewExpression"
,ObjectExpression:"ObjectExpression",ObjectPattern:"ObjectPattern",Program:"Program"
,Property:"Property",RestElement:"RestElement",ReturnStatement:"ReturnStatement"
,SequenceExpression:"SequenceExpression",SpreadElement:"SpreadElement",Super:"Super"
,SwitchCase:"SwitchCase",SwitchStatement:"SwitchStatement",TaggedTemplateExpression
:"TaggedTemplateExpression",TemplateElement:"TemplateElement",TemplateLiteral:"TemplateLiteral"
,ThisExpression:"ThisExpression",ThrowStatement:"ThrowStatement",TryStatement:"TryStatement"
,UnaryExpression:"UnaryExpression",UpdateExpression:"UpdateExpression",VariableDeclaration
:"VariableDeclaration",VariableDeclarator:"VariableDeclarator",WhileStatement:"WhileStatement"
,WithStatement:"WithStatement",YieldExpression:"YieldExpression"},s={ArrowParameterPlaceHolder
:"ArrowParameterPlaceHolder"},o={UnexpectedToken:"Unexpected token %0",UnexpectedNumber
:"Unexpected number",UnexpectedString:"Unexpected string",UnexpectedIdentifier:"Unexpected identifier"
,UnexpectedReserved:"Unexpected reserved word",UnexpectedTemplate:"Unexpected quasi %0"
,UnexpectedEOS:"Unexpected end of input",NewlineAfterThrow:"Illegal newline after throw"
,InvalidRegExp:"Invalid regular expression",UnterminatedRegExp:"Invalid regular expression: missing /"
,InvalidLHSInAssignment:"Invalid left-hand side in assignment",InvalidLHSInForIn
:"Invalid left-hand side in for-in",InvalidLHSInForLoop:"Invalid left-hand side in for-loop"
,MultipleDefaultsInSwitch:"More than one default clause in switch statement",NoCatchOrFinally
:"Missing catch or finally after try",UnknownLabel:"Undefined label '%0'",Redeclaration
:"%0 '%1' has already been declared",IllegalContinue:"Illegal continue statement"
,IllegalBreak:"Illegal break statement",IllegalReturn:"Illegal return statement"
,StrictModeWith:"Strict mode code may not include a with statement",StrictCatchVariable
:"Catch variable may not be eval or arguments in strict mode",StrictVarName:"Variable name may not be eval or arguments in strict mode"
,StrictParamName:"Parameter name eval or arguments is not allowed in strict mode"
,StrictParamDupe:"Strict mode function may not have duplicate parameter names",StrictFunctionName
:"Function name may not be eval or arguments in strict mode",StrictOctalLiteral:"Octal literals are not allowed in strict mode."
,StrictDelete:"Delete of an unqualified identifier in strict mode.",StrictLHSAssignment
:"Assignment to eval or arguments is not allowed in strict mode",StrictLHSPostfix
:"Postfix increment/decrement may not have eval or arguments operand in strict mode"
,StrictLHSPrefix:"Prefix increment/decrement may not have eval or arguments operand in strict mode"
,StrictReservedWord:"Use of future reserved word in strict mode",TemplateOctalLiteral
:"Octal literals are not allowed in template strings.",ParameterAfterRestParameter
:"Rest parameter must be last formal parameter",DefaultRestParameter:"Unexpected token ="
,ObjectPatternAsRestParameter:"Unexpected token {",DuplicateProtoProperty:"Duplicate __proto__ fields are not allowed in object literals"
,ConstructorSpecialMethod:"Class constructor may not be an accessor",DuplicateConstructor
:"A class may only have one constructor",StaticPrototype:"Classes may not have static property named prototype"
,MissingFromClause:"Unexpected token",NoAsAfterImportNamespace:"Unexpected token"
,InvalidModuleSpecifier:"Unexpected token",IllegalImportDeclaration:"Unexpected token"
,IllegalExportDeclaration:"Unexpected token",DuplicateBinding:"Duplicate binding %0"
},u={NonAsciiIdentifierStart:/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/
,NonAsciiIdentifierPart:/[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
},St.prototype=Et.prototype={processComment:function(){var e,t,n,r=N.bottomRightStack
,s,o,u=r[r.length-1];if(this.type===i.Program&&this.body.length>0)return;if(N.trailingComments
.length>0){n=[];for(s=N.trailingComments.length-1;s>=0;--s)o=N.trailingComments[
s],o.range[0]>=this.range[1]&&(n.unshift(o),N.trailingComments.splice(s,1));N.trailingComments=
[]}else u&&u.trailingComments&&u.trailingComments[0].range[0]>=this.range[1]&&(n=
u.trailingComments,delete u.trailingComments);while(u&&u.range[0]>=this.range[0]
)e=r.pop(),u=r[r.length-1];if(e){if(e.leadingComments){t=[];for(s=e.leadingComments
.length-1;s>=0;--s)o=e.leadingComments[s],o.range[1]<=this.range[0]&&(t.unshift(
o),e.leadingComments.splice(s,1));e.leadingComments.length||(e.leadingComments=undefined
)}}else if(N.leadingComments.length>0){t=[];for(s=N.leadingComments.length-1;s>=0
;--s)o=N.leadingComments[s],o.range[1]<=this.range[0]&&(t.unshift(o),N.leadingComments
.splice(s,1))}t&&t.length>0&&(this.leadingComments=t),n&&n.length>0&&(this.trailingComments=
n),r.push(this)},finish:function(){N.range&&(this.range[1]=v),N.loc&&(this.loc.end=
{line:m,column:v-g},N.source&&(this.loc.source=N.source)),N.attachComment&&this.
processComment()},finishArrayExpression:function(e){return this.type=i.ArrayExpression
,this.elements=e,this.finish(),this},finishArrayPattern:function(e){return this.
type=i.ArrayPattern,this.elements=e,this.finish(),this},finishArrowFunctionExpression
:function(e,t,n,r){return this.type=i.ArrowFunctionExpression,this.id=null,this.
params=e,this.defaults=t,this.body=n,this.generator=!1,this.expression=r,this.finish
(),this},finishAssignmentExpression:function(e,t,n){return this.type=i.AssignmentExpression
,this.operator=e,this.left=t,this.right=n,this.finish(),this},finishAssignmentPattern
:function(e,t){return this.type=i.AssignmentPattern,this.left=e,this.right=t,this
.finish(),this},finishBinaryExpression:function(e,t,n){return this.type=e==="||"||
e==="&&"?i.LogicalExpression:i.BinaryExpression,this.operator=e,this.left=t,this
.right=n,this.finish(),this},finishBlockStatement:function(e){return this.type=i
.BlockStatement,this.body=e,this.finish(),this},finishBreakStatement:function(e)
{return this.type=i.BreakStatement,this.label=e,this.finish(),this},finishCallExpression
:function(e,t){return this.type=i.CallExpression,this.callee=e,this.arguments=t,
this.finish(),this},finishCatchClause:function(e,t){return this.type=i.CatchClause
,this.param=e,this.body=t,this.finish(),this},finishClassBody:function(e){return this
.type=i.ClassBody,this.body=e,this.finish(),this},finishClassDeclaration:function(
e,t,n){return this.type=i.ClassDeclaration,this.id=e,this.superClass=t,this.body=
n,this.finish(),this},finishClassExpression:function(e,t,n){return this.type=i.ClassExpression
,this.id=e,this.superClass=t,this.body=n,this.finish(),this},finishConditionalExpression
:function(e,t,n){return this.type=i.ConditionalExpression,this.test=e,this.consequent=
t,this.alternate=n,this.finish(),this},finishContinueStatement:function(e){return this
.type=i.ContinueStatement,this.label=e,this.finish(),this},finishDebuggerStatement
:function(){return this.type=i.DebuggerStatement,this.finish(),this},finishDoWhileStatement
:function(e,t){return this.type=i.DoWhileStatement,this.body=e,this.test=t,this.
finish(),this},finishEmptyStatement:function(){return this.type=i.EmptyStatement
,this.finish(),this},finishExpressionStatement:function(e){return this.type=i.ExpressionStatement
,this.expression=e,this.finish(),this},finishForStatement:function(e,t,n,r){return this
.type=i.ForStatement,this.init=e,this.test=t,this.update=n,this.body=r,this.finish
(),this},finishForOfStatement:function(e,t,n){return this.type=i.ForOfStatement,
this.left=e,this.right=t,this.body=n,this.finish(),this},finishForInStatement:function(
e,t,n){return this.type=i.ForInStatement,this.left=e,this.right=t,this.body=n,this
.each=!1,this.finish(),this},finishFunctionDeclaration:function(e,t,n,r,s){return this
.type=i.FunctionDeclaration,this.id=e,this.params=t,this.defaults=n,this.body=r,
this.generator=s,this.expression=!1,this.finish(),this},finishFunctionExpression
:function(e,t,n,r,s){return this.type=i.FunctionExpression,this.id=e,this.params=
t,this.defaults=n,this.body=r,this.generator=s,this.expression=!1,this.finish(),
this},finishIdentifier:function(e){return this.type=i.Identifier,this.name=e,this
.finish(),this},finishIfStatement:function(e,t,n){return this.type=i.IfStatement
,this.test=e,this.consequent=t,this.alternate=n,this.finish(),this},finishLabeledStatement
:function(e,t){return this.type=i.LabeledStatement,this.label=e,this.body=t,this
.finish(),this},finishLiteral:function(e){return this.type=i.Literal,this.value=
e.value,this.raw=a.slice(e.start,e.end),e.regex&&(this.regex=e.regex),this.finish
(),this},finishMemberExpression:function(e,t,n){return this.type=i.MemberExpression
,this.computed=e==="[",this.object=t,this.property=n,this.finish(),this},finishMetaProperty
:function(e,t){return this.type=i.MetaProperty,this.meta=e,this.property=t,this.
finish(),this},finishNewExpression:function(e,t){return this.type=i.NewExpression
,this.callee=e,this.arguments=t,this.finish(),this},finishObjectExpression:function(
e){return this.type=i.ObjectExpression,this.properties=e,this.finish(),this},finishObjectPattern
:function(e){return this.type=i.ObjectPattern,this.properties=e,this.finish(),this
},finishPostfixExpression:function(e,t){return this.type=i.UpdateExpression,this
.operator=e,this.argument=t,this.prefix=!1,this.finish(),this},finishProgram:function(
e){return this.type=i.Program,this.body=e,l==="module"&&(this.sourceType=l),this
.finish(),this},finishProperty:function(e,t,n,r,s,o){return this.type=i.Property
,this.key=t,this.computed=n,this.value=r,this.kind=e,this.method=s,this.shorthand=
o,this.finish(),this},finishRestElement:function(e){return this.type=i.RestElement
,this.argument=e,this.finish(),this},finishReturnStatement:function(e){return this
.type=i.ReturnStatement,this.argument=e,this.finish(),this},finishSequenceExpression
:function(e){return this.type=i.SequenceExpression,this.expressions=e,this.finish
(),this},finishSpreadElement:function(e){return this.type=i.SpreadElement,this.argument=
e,this.finish(),this},finishSwitchCase:function(e,t){return this.type=i.SwitchCase
,this.test=e,this.consequent=t,this.finish(),this},finishSuper:function(){return this
.type=i.Super,this.finish(),this},finishSwitchStatement:function(e,t){return this
.type=i.SwitchStatement,this.discriminant=e,this.cases=t,this.finish(),this},finishTaggedTemplateExpression
:function(e,t){return this.type=i.TaggedTemplateExpression,this.tag=e,this.quasi=
t,this.finish(),this},finishTemplateElement:function(e,t){return this.type=i.TemplateElement
,this.value=e,this.tail=t,this.finish(),this},finishTemplateLiteral:function(e,t
){return this.type=i.TemplateLiteral,this.quasis=e,this.expressions=t,this.finish
(),this},finishThisExpression:function(){return this.type=i.ThisExpression,this.
finish(),this},finishThrowStatement:function(e){return this.type=i.ThrowStatement
,this.argument=e,this.finish(),this},finishTryStatement:function(e,t,n){return this
.type=i.TryStatement,this.block=e,this.guardedHandlers=[],this.handlers=t?[t]:[]
,this.handler=t,this.finalizer=n,this.finish(),this},finishUnaryExpression:function(
e,t){return this.type=e==="++"||e==="--"?i.UpdateExpression:i.UnaryExpression,this
.operator=e,this.argument=t,this.prefix=!0,this.finish(),this},finishVariableDeclaration
:function(e){return this.type=i.VariableDeclaration,this.declarations=e,this.kind="var"
,this.finish(),this},finishLexicalDeclaration:function(e,t){return this.type=i.VariableDeclaration
,this.declarations=e,this.kind=t,this.finish(),this},finishVariableDeclarator:function(
e,t){return this.type=i.VariableDeclarator,this.id=e,this.init=t,this.finish(),this
},finishWhileStatement:function(e,t){return this.type=i.WhileStatement,this.test=
e,this.body=t,this.finish(),this},finishWithStatement:function(e,t){return this.
type=i.WithStatement,this.object=e,this.body=t,this.finish(),this},finishExportSpecifier
:function(e,t){return this.type=i.ExportSpecifier,this.exported=t||e,this.local=
e,this.finish(),this},finishImportDefaultSpecifier:function(e){return this.type=
i.ImportDefaultSpecifier,this.local=e,this.finish(),this},finishImportNamespaceSpecifier
:function(e){return this.type=i.ImportNamespaceSpecifier,this.local=e,this.finish
(),this},finishExportNamedDeclaration:function(e,t,n){return this.type=i.ExportNamedDeclaration
,this.declaration=e,this.specifiers=t,this.source=n,this.finish(),this},finishExportDefaultDeclaration
:function(e){return this.type=i.ExportDefaultDeclaration,this.declaration=e,this
.finish(),this},finishExportAllDeclaration:function(e){return this.type=i.ExportAllDeclaration
,this.source=e,this.finish(),this},finishImportSpecifier:function(e,t){return this
.type=i.ImportSpecifier,this.local=e||t,this.imported=t,this.finish(),this},finishImportDeclaration
:function(e,t){return this.type=i.ImportDeclaration,this.specifiers=e,this.source=
t,this.finish(),this},finishYieldExpression:function(e,t){return this.type=i.YieldExpression
,this.argument=e,this.delegate=t,this.finish(),this}},e.version="2.5.0",e.tokenize=
Er,e.parse=Sr,e.Syntax=function(){var e,t={};typeof Object.create=="function"&&(
t=Object.create(null));for(e in i)i.hasOwnProperty(e)&&(t[e]=i[e]);return typeof
Object.freeze=="function"&&Object.freeze(t),t}()})
}());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib estraverse
/* jslint-ignore-begin */
// https://github.com/estools/estraverse/blob/1.9.3/estraverse.js
// utility2-uglifyjs https://raw.githubusercontent.com/estools/estraverse/1.9.3/estraverse.js
(function () { var exports; exports = local.estraverse = {};
(function(e,t){"use strict";typeof define=="function"&&define.amd?define(["exports"
],t):typeof exports!="undefined"?t(exports):t(e.estraverse={})})(this,function e
(t){"use strict";function c(){}function h(e){var t={},n,r;for(n in e)e.hasOwnProperty
(n)&&(r=e[n],typeof r=="object"&&r!==null?t[n]=h(r):t[n]=r);return t}function p(
e){var t={},n;for(n in e)e.hasOwnProperty(n)&&(t[n]=e[n]);return t}function d(e,
t){var n,r,i,s;r=e.length,i=0;while(r)n=r>>>1,s=i+n,t(e[s])?r=n:(i=s+1,r-=n+1);return i
}function v(e,t){var n,r,i,s;r=e.length,i=0;while(r)n=r>>>1,s=i+n,t(e[s])?(i=s+1
,r-=n+1):r=n;return i}function m(e,t){var n=u(t),r,i,s;for(i=0,s=n.length;i<s;i+=1
)r=n[i],e[r]=t[r];return e}function g(e,t){this.parent=e,this.key=t}function y(e
,t,n,r){this.node=e,this.path=t,this.wrap=n,this.ref=r}function b(){}function w(
e){return e==null?!1:typeof e=="object"&&typeof e.type=="string"}function E(e,t)
{return(e===n.ObjectExpression||e===n.ObjectPattern)&&"properties"===t}function S
(e,t){var n=new b;return n.traverse(e,t)}function x(e,t){var n=new b;return n.replace
(e,t)}function T(e,t){var n;return n=d(t,function(n){return n.range[0]>e.range[0
]}),e.extendedRange=[e.range[0],e.range[1]],n!==t.length&&(e.extendedRange[1]=t[
n].range[0]),n-=1,n>=0&&(e.extendedRange[0]=t[n].range[1]),e}function N(e,t,n){var r=
[],s,o,u,a;if(!e.range)throw new Error("attachComments needs range information")
;if(!n.length){if(t.length){for(u=0,o=t.length;u<o;u+=1)s=h(t[u]),s.extendedRange=
[0,e.range[0]],r.push(s);e.leadingComments=r}return e}for(u=0,o=t.length;u<o;u+=1
)r.push(T(h(t[u]),n));return a=0,S(e,{enter:function(e){var t;while(a<r.length){
t=r[a];if(t.extendedRange[1]>e.range[0])break;t.extendedRange[1]===e.range[0]?(e
.leadingComments||(e.leadingComments=[]),e.leadingComments.push(t),r.splice(a,1)
):a+=1}if(a===r.length)return i.Break;if(r[a].extendedRange[0]>e.range[1])return i
.Skip}}),a=0,S(e,{leave:function(e){var t;while(a<r.length){t=r[a];if(e.range[1]<
t.extendedRange[0])break;e.range[1]===t.extendedRange[0]?(e.trailingComments||(e
.trailingComments=[]),e.trailingComments.push(t),r.splice(a,1)):a+=1}if(a===r.length
)return i.Break;if(r[a].extendedRange[0]>e.range[1])return i.Skip}}),e}var n,r,i
,s,o,u,a,f,l;return r=Array.isArray,r||(r=function(t){return Object.prototype.toString
.call(t)==="[object Array]"}),c(p),c(v),o=Object.create||function(){function e()
{}return function(t){return e.prototype=t,new e}}(),u=Object.keys||function(e){var t=
[],n;for(n in e)t.push(n);return t},n={AssignmentExpression:"AssignmentExpression"
,ArrayExpression:"ArrayExpression",ArrayPattern:"ArrayPattern",ArrowFunctionExpression
:"ArrowFunctionExpression",AwaitExpression:"AwaitExpression",BlockStatement:"BlockStatement"
,BinaryExpression:"BinaryExpression",BreakStatement:"BreakStatement",CallExpression
:"CallExpression",CatchClause:"CatchClause",ClassBody:"ClassBody",ClassDeclaration
:"ClassDeclaration",ClassExpression:"ClassExpression",ComprehensionBlock:"ComprehensionBlock"
,ComprehensionExpression:"ComprehensionExpression",ConditionalExpression:"ConditionalExpression"
,ContinueStatement:"ContinueStatement",DebuggerStatement:"DebuggerStatement",DirectiveStatement
:"DirectiveStatement",DoWhileStatement:"DoWhileStatement",EmptyStatement:"EmptyStatement"
,ExportBatchSpecifier:"ExportBatchSpecifier",ExportDeclaration:"ExportDeclaration"
,ExportSpecifier:"ExportSpecifier",ExpressionStatement:"ExpressionStatement",ForStatement
:"ForStatement",ForInStatement:"ForInStatement",ForOfStatement:"ForOfStatement",
FunctionDeclaration:"FunctionDeclaration",FunctionExpression:"FunctionExpression"
,GeneratorExpression:"GeneratorExpression",Identifier:"Identifier",IfStatement:"IfStatement"
,ImportDeclaration:"ImportDeclaration",ImportDefaultSpecifier:"ImportDefaultSpecifier"
,ImportNamespaceSpecifier:"ImportNamespaceSpecifier",ImportSpecifier:"ImportSpecifier"
,Literal:"Literal",LabeledStatement:"LabeledStatement",LogicalExpression:"LogicalExpression"
,MemberExpression:"MemberExpression",MethodDefinition:"MethodDefinition",ModuleSpecifier
:"ModuleSpecifier",NewExpression:"NewExpression",ObjectExpression:"ObjectExpression"
,ObjectPattern:"ObjectPattern",Program:"Program",Property:"Property",ReturnStatement
:"ReturnStatement",SequenceExpression:"SequenceExpression",SpreadElement:"SpreadElement"
,SwitchStatement:"SwitchStatement",SwitchCase:"SwitchCase",TaggedTemplateExpression
:"TaggedTemplateExpression",TemplateElement:"TemplateElement",TemplateLiteral:"TemplateLiteral"
,ThisExpression:"ThisExpression",ThrowStatement:"ThrowStatement",TryStatement:"TryStatement"
,UnaryExpression:"UnaryExpression",UpdateExpression:"UpdateExpression",VariableDeclaration
:"VariableDeclaration",VariableDeclarator:"VariableDeclarator",WhileStatement:"WhileStatement"
,WithStatement:"WithStatement",YieldExpression:"YieldExpression"},s={AssignmentExpression
:["left","right"],ArrayExpression:["elements"],ArrayPattern:["elements"],ArrowFunctionExpression
:["params","defaults","rest","body"],AwaitExpression:["argument"],BlockStatement
:["body"],BinaryExpression:["left","right"],BreakStatement:["label"],CallExpression
:["callee","arguments"],CatchClause:["param","body"],ClassBody:["body"],ClassDeclaration
:["id","body","superClass"],ClassExpression:["id","body","superClass"],ComprehensionBlock
:["left","right"],ComprehensionExpression:["blocks","filter","body"],ConditionalExpression
:["test","consequent","alternate"],ContinueStatement:["label"],DebuggerStatement
:[],DirectiveStatement:[],DoWhileStatement:["body","test"],EmptyStatement:[],ExportBatchSpecifier
:[],ExportDeclaration:["declaration","specifiers","source"],ExportSpecifier:["id"
,"name"],ExpressionStatement:["expression"],ForStatement:["init","test","update"
,"body"],ForInStatement:["left","right","body"],ForOfStatement:["left","right","body"
],FunctionDeclaration:["id","params","defaults","rest","body"],FunctionExpression
:["id","params","defaults","rest","body"],GeneratorExpression:["blocks","filter"
,"body"],Identifier:[],IfStatement:["test","consequent","alternate"],ImportDeclaration
:["specifiers","source"],ImportDefaultSpecifier:["id"],ImportNamespaceSpecifier:
["id"],ImportSpecifier:["id","name"],Literal:[],LabeledStatement:["label","body"
],LogicalExpression:["left","right"],MemberExpression:["object","property"],MethodDefinition
:["key","value"],ModuleSpecifier:[],NewExpression:["callee","arguments"],ObjectExpression
:["properties"],ObjectPattern:["properties"],Program:["body"],Property:["key","value"
],ReturnStatement:["argument"],SequenceExpression:["expressions"],SpreadElement:
["argument"],SwitchStatement:["discriminant","cases"],SwitchCase:["test","consequent"
],TaggedTemplateExpression:["tag","quasi"],TemplateElement:[],TemplateLiteral:["quasis"
,"expressions"],ThisExpression:[],ThrowStatement:["argument"],TryStatement:["block"
,"handlers","handler","guardedHandlers","finalizer"],UnaryExpression:["argument"
],UpdateExpression:["argument"],VariableDeclaration:["declarations"],VariableDeclarator
:["id","init"],WhileStatement:["test","body"],WithStatement:["object","body"],YieldExpression
:["argument"]},a={},f={},l={},i={Break:a,Skip:f,Remove:l},g.prototype.replace=function(
t){this.parent[this.key]=t},g.prototype.remove=function(){return r(this.parent)?
(this.parent.splice(this.key,1),!0):(this.replace(null),!1)},b.prototype.path=function(
){function a(e,t){if(r(t))for(i=0,s=t.length;i<s;++i)e.push(t[i]);else e.push(t)
}var t,n,i,s,o,u;if(!this.__current.path)return null;o=[];for(t=2,n=this.__leavelist
.length;t<n;++t)u=this.__leavelist[t],a(o,u.path);return a(o,this.__current.path
),o},b.prototype.type=function(){var e=this.current();return e.type||this.__current
.wrap},b.prototype.parents=function(){var t,n,r;r=[];for(t=1,n=this.__leavelist.
length;t<n;++t)r.push(this.__leavelist[t].node);return r},b.prototype.current=function(
){return this.__current.node},b.prototype.__execute=function(t,n){var r,i;return i=
undefined,r=this.__current,this.__current=n,this.__state=null,t&&(i=t.call(this,
n.node,this.__leavelist[this.__leavelist.length-1].node)),this.__current=r,i},b.
prototype.notify=function(t){this.__state=t},b.prototype.skip=function(){this.notify
(f)},b.prototype["break"]=function(){this.notify(a)},b.prototype.remove=function(
){this.notify(l)},b.prototype.__initialize=function(e,t){this.visitor=t,this.root=
e,this.__worklist=[],this.__leavelist=[],this.__current=null,this.__state=null,this
.__fallback=t.fallback==="iteration",this.__keys=s,t.keys&&(this.__keys=m(o(this
.__keys),t.keys))},b.prototype.traverse=function(t,n){var i,s,o,l,c,h,p,d,v,m,g,
b;this.__initialize(t,n),b={},i=this.__worklist,s=this.__leavelist,i.push(new y(
t,null,null,null)),s.push(new y(null,null,null,null));while(i.length){o=i.pop();
if(o===b){o=s.pop(),h=this.__execute(n.leave,o);if(this.__state===a||h===a)return;
continue}if(o.node){h=this.__execute(n.enter,o);if(this.__state===a||h===a)return;
i.push(b),s.push(o);if(this.__state===f||h===f)continue;l=o.node,c=o.wrap||l.type
,m=this.__keys[c];if(!m){if(!this.__fallback)throw new Error("Unknown node type "+
c+".");m=u(l)}d=m.length;while((d-=1)>=0){p=m[d],g=l[p];if(!g)continue;if(r(g)){
v=g.length;while((v-=1)>=0){if(!g[v])continue;if(E(c,m[d]))o=new y(g[v],[p,v],"Property"
,null);else{if(!w(g[v]))continue;o=new y(g[v],[p,v],null,null)}i.push(o)}}else w
(g)&&i.push(new y(g,p,null,null))}}}},b.prototype.replace=function(t,n){function i
(e){var t,n,r,i;if(e.ref.remove()){n=e.ref.key,i=e.ref.parent,t=s.length;while(t--
){r=s[t];if(r.ref&&r.ref.parent===i){if(r.ref.key<n)break;--r.ref.key}}}}var s,o
,c,h,p,d,v,m,b,S,x,T,N;this.__initialize(t,n),x={},s=this.__worklist,o=this.__leavelist
,T={root:t},d=new y(t,null,null,new g(T,"root")),s.push(d),o.push(d);while(s.length
){d=s.pop();if(d===x){d=o.pop(),p=this.__execute(n.leave,d),p!==undefined&&p!==a&&
p!==f&&p!==l&&d.ref.replace(p),(this.__state===l||p===l)&&i(d);if(this.__state===
a||p===a)return T.root;continue}p=this.__execute(n.enter,d),p!==undefined&&p!==a&&
p!==f&&p!==l&&(d.ref.replace(p),d.node=p);if(this.__state===l||p===l)i(d),d.node=
null;if(this.__state===a||p===a)return T.root;c=d.node;if(!c)continue;s.push(x),
o.push(d);if(this.__state===f||p===f)continue;h=d.wrap||c.type,b=this.__keys[h];
if(!b){if(!this.__fallback)throw new Error("Unknown node type "+h+".");b=u(c)}v=
b.length;while((v-=1)>=0){N=b[v],S=c[N];if(!S)continue;if(r(S)){m=S.length;while(
(m-=1)>=0){if(!S[m])continue;if(E(h,b[v]))d=new y(S[m],[N,m],"Property",new g(S,
m));else{if(!w(S[m]))continue;d=new y(S[m],[N,m],null,new g(S,m))}s.push(d)}}else w
(S)&&s.push(new y(S,N,null,new g(c,N)))}}return T.root},t.version="1.8.1-dev",t.
Syntax=n,t.traverse=S,t.replace=x,t.attachComments=N,t.VisitorKeys=s,t.VisitorOption=
i,t.Controller=b,t.cloneEnvironment=function(){return e({})},t})
}());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib esutils.code
/* jslint-ignore-begin */
// https://github.com/estools/esutils/blob/2.0.2/lib/code.js
// utility2-uglifyjs https://raw.githubusercontent.com/estools/esutils/2.0.2/lib/code.js
(function () { var module; module = {};
(function(){"use strict";function o(e){return 48<=e&&e<=57}function u(e){return 48<=
e&&e<=57||97<=e&&e<=102||65<=e&&e<=70}function a(e){return e>=48&&e<=55}function f
(e){return e===32||e===9||e===11||e===12||e===160||e>=5760&&n.indexOf(e)>=0}function l
(e){return e===10||e===13||e===8232||e===8233}function c(e){if(e<=65535)return String
.fromCharCode(e);var t=String.fromCharCode(Math.floor((e-65536)/1024)+55296),n=String
.fromCharCode((e-65536)%1024+56320);return t+n}function h(e){return e<128?r[e]:t
.NonAsciiIdentifierStart.test(c(e))}function p(e){return e<128?i[e]:t.NonAsciiIdentifierPart
.test(c(e))}function d(t){return t<128?r[t]:e.NonAsciiIdentifierStart.test(c(t))
}function v(t){return t<128?i[t]:e.NonAsciiIdentifierPart.test(c(t))}var e,t,n,r
,i,s;t={NonAsciiIdentifierStart:/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
,NonAsciiIdentifierPart:/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
},e={NonAsciiIdentifierStart:/[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/
,NonAsciiIdentifierPart:/[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
},n=[5760,6158,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8239,8287,12288
,65279],r=new Array(128);for(s=0;s<128;++s)r[s]=s>=97&&s<=122||s>=65&&s<=90||s===36||
s===95;i=new Array(128);for(s=0;s<128;++s)i[s]=s>=97&&s<=122||s>=65&&s<=90||s>=48&&
s<=57||s===36||s===95;module.exports={isDecimalDigit:o,isHexDigit:u,isOctalDigit
:a,isWhiteSpace:f,isLineTerminator:l,isIdentifierStartES5:h,isIdentifierPartES5:
p,isIdentifierStartES6:d,isIdentifierPartES6:v}})()
local.esutils = { code: module.exports }; }());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib escodegen
/* jslint-ignore-begin */
// https://github.com/estools/escodegen/blob/1.7.1/escodegen.js
// utility2-uglifyjs https://raw.githubusercontent.com/estools/escodegen/1.7.1/escodegen.js
(function () { var exports; exports = local.escodegen = {};
(function(){"use strict";function k(e){return bt.Expression.hasOwnProperty(e.type
)}function L(e){return bt.Statement.hasOwnProperty(e.type)}function V(){return{indent
:null,base:null,parse:null,comment:!1,format:{indent:{style:"    ",base:0,adjustMultilineComment
:!1},newline:"\n",space:" ",json:!1,renumber:!1,hexadecimal:!1,quotes:"single",escapeless
:!1,compact:!1,parentheses:!0,semicolons:!0,safeConcatenation:!1,preserveBlankLines
:!1},moz:{comprehensionExpressionStartsWithAssignment:!1,starlessGenerator:!1},sourceMap
:null,sourceMapRoot:null,sourceMapWithCode:!1,directive:!1,raw:!0,verbatim:null,
sourceCode:null}}function $(e,t){var n="";for(t|=0;t>0;t>>>=1,e+=e)t&1&&(n+=e);return n
}function J(e){return/[\r\n]/g.test(e)}function K(e){var t=e.length;return t&&s.
code.isLineTerminator(e.charCodeAt(t-1))}function Q(e,t){var n;for(n in t)t.hasOwnProperty
(n)&&(e[n]=t[n]);return e}function G(e,t){function i(e){return typeof e=="object"&&
e instanceof Object&&!(e instanceof RegExp)}var n,r;for(n in t)t.hasOwnProperty(
n)&&(r=t[n],i(r)?i(e[n])?G(e[n],r):e[n]=G({},r):e[n]=r);return e}function Y(e){var t
,n,r,i,s;if(e!==e)throw new Error("Numeric literal whose value is NaN");if(e<0||
e===0&&1/e<0)throw new Error("Numeric literal whose value is negative");if(e===1/0
)return f?"null":l?"1e400":"1e+400";t=""+e;if(!l||t.length<3)return t;n=t.indexOf
("."),!f&&t.charCodeAt(0)===48&&n===1&&(n=0,t=t.slice(1)),r=t,t=t.replace("e+","e"
),i=0,(s=r.indexOf("e"))>0&&(i=+r.slice(s+1),r=r.slice(0,s)),n>=0&&(i-=r.length-
n-1,r=+(r.slice(0,n)+r.slice(n+1))+""),s=0;while(r.charCodeAt(r.length+s-1)===48
)--s;return s!==0&&(i-=s,r=r.slice(0,s)),i!==0&&(r+="e"+i),(r.length<t.length||c&&
e>1e12&&Math.floor(e)===e&&(r="0x"+e.toString(16)).length<t.length)&&+r===e&&(t=
r),t}function Z(e,t){return(e&-2)===8232?(t?"u":"\\u")+(e===8232?"2028":"2029"):
e===10||e===13?(t?"":"\\")+(e===10?"n":"r"):String.fromCharCode(e)}function et(e
){var t,n,r,i,s,o,u,a;n=e.toString();if(e.source){t=n.match(/\/([^/]*)$/);if(!t)
return n;r=t[1],n="",u=!1,a=!1;for(i=0,s=e.source.length;i<s;++i)o=e.source.charCodeAt
(i),a?(n+=Z(o,a),a=!1):(u?o===93&&(u=!1):o===47?n+="\\":o===91&&(u=!0),n+=Z(o,a)
,a=o===92);return"/"+n+"/"+r}return n}function tt(e,t){var n;return e===8?"\\b":
e===12?"\\f":e===9?"\\t":(n=e.toString(16).toUpperCase(),f||e>255?"\\u"+"0000".slice
(n.length)+n:e===0&&!s.code.isDecimalDigit(t)?"\\0":e===11?"\\x0B":"\\x"+"00".slice
(n.length)+n)}function nt(e){if(e===92)return"\\\\";if(e===10)return"\\n";if(e===13
)return"\\r";if(e===8232)return"\\u2028";if(e===8233)return"\\u2029";throw new Error
("Incorrectly classified character")}function rt(e){var t,n,r,i;i=h==="double"?'"'
:"'";for(t=0,n=e.length;t<n;++t){r=e.charCodeAt(t);if(r===39){i='"';break}if(r===34
){i="'";break}r===92&&++t}return i+e+i}function it(e){var t="",n,r,i,o=0,u=0,a,l
;for(n=0,r=e.length;n<r;++n){i=e.charCodeAt(n);if(i===39)++o;else if(i===34)++u;
else if(i===47&&f)t+="\\";else{if(s.code.isLineTerminator(i)||i===92){t+=nt(i);continue}
if(!s.code.isIdentifierPartES5(i)&&(f&&i<32||!f&&!p&&(i<32||i>126))){t+=tt(i,e.charCodeAt
(n+1));continue}}t+=String.fromCharCode(i)}a=!(h==="double"||h==="auto"&&u<o),l=
a?"'":'"';if(a?!o:!u)return l+t+l;e=t,t=l;for(n=0,r=e.length;n<r;++n){i=e.charCodeAt
(n);if(i===39&&a||i===34&&!a)t+="\\";t+=String.fromCharCode(i)}return t+l}function st
(e){var t,n,r,i="";for(t=0,n=e.length;t<n;++t)r=e[t],i+=o(r)?st(r):r;return i}function ot
(e,t){if(!S)return o(e)?st(e):e;if(t==null){if(e instanceof r)return e;t={}}return t
.loc==null?new r(null,null,S,e,t.name||null):new r(t.loc.start.line,t.loc.start.
column,S===!0?t.loc.source||null:S,e,t.name||null)}function ut(){return v?v:" "}
function at(e,t){var n,r,i,o;return n=ot(e).toString(),n.length===0?[t]:(r=ot(t)
.toString(),r.length===0?[e]:(i=n.charCodeAt(n.length-1),o=r.charCodeAt(0),(i===43||
i===45)&&i===o||s.code.isIdentifierPartES5(i)&&s.code.isIdentifierPartES5(o)||i===47&&
o===105?[e,ut(),t]:s.code.isWhiteSpace(i)||s.code.isLineTerminator(i)||s.code.isWhiteSpace
(o)||s.code.isLineTerminator(o)?[e,t]:[e,v,t]))}function ft(e){return[u,e]}function lt
(e){var t;t=u,u+=a,e(u),u=t}function ct(e){var t;for(t=e.length-1;t>=0;--t)if(s.
code.isLineTerminator(e.charCodeAt(t)))break;return e.length-1-t}function ht(e,t
){var n,r,i,o,a,f,l,c;n=e.split(/\r\n|[\r\n]/),f=Number.MAX_VALUE;for(r=1,i=n.length
;r<i;++r){o=n[r],a=0;while(a<o.length&&s.code.isWhiteSpace(o.charCodeAt(a)))++a;
f>a&&(f=a)}typeof t!="undefined"?(l=u,n[1][f]==="*"&&(t+=" "),u=t):(f&1&&--f,l=u
);for(r=1,i=n.length;r<i;++r)c=ot(ft(n[r].slice(f))),n[r]=S?c.join(""):c;return u=
l,n.join("\n")}function pt(e,t){if(e.type==="Line"){if(K(e.value))return"//"+e.value
;var n="//"+e.value;return T||(n+="\n"),n}return w.format.indent.adjustMultilineComment&&/[\n\r]/
.test(e.value)?ht("/*"+e.value+"*/",t):"/*"+e.value+"*/"}function dt(t,n){var r,
i,s,o,f,l,c,h,p,d,v,m,g,b;if(t.leadingComments&&t.leadingComments.length>0){o=n;
if(T){s=t.leadingComments[0],n=[],h=s.extendedRange,p=s.range,v=x.substring(h[0]
,p[0]),b=(v.match(/\n/g)||[]).length,b>0?(n.push($("\n",b)),n.push(ft(pt(s)))):(
n.push(v),n.push(pt(s))),d=p;for(r=1,i=t.leadingComments.length;r<i;r++)s=t.leadingComments
[r],p=s.range,m=x.substring(d[1],p[0]),b=(m.match(/\n/g)||[]).length,n.push($("\n"
,b)),n.push(ft(pt(s))),d=p;g=x.substring(p[1],h[1]),b=(g.match(/\n/g)||[]).length
,n.push($("\n",b))}else{s=t.leadingComments[0],n=[],y&&t.type===e.Program&&t.body
.length===0&&n.push("\n"),n.push(pt(s)),K(ot(n).toString())||n.push("\n");for(r=1
,i=t.leadingComments.length;r<i;++r)s=t.leadingComments[r],c=[pt(s)],K(ot(c).toString
())||c.push("\n"),n.push(ft(c))}n.push(ft(o))}if(t.trailingComments)if(T)s=t.trailingComments
[0],h=s.extendedRange,p=s.range,v=x.substring(h[0],p[0]),b=(v.match(/\n/g)||[]).
length,b>0?(n.push($("\n",b)),n.push(ft(pt(s)))):(n.push(v),n.push(pt(s)));else{
f=!K(ot(n).toString()),l=$(" ",ct(ot([u,n,a]).toString()));for(r=0,i=t.trailingComments
.length;r<i;++r)s=t.trailingComments[r],f?(r===0?n=[n,a]:n=[n,l],n.push(pt(s,l))
):n=[n,ft(pt(s))],r!==i-1&&!K(ot(n).toString())&&(n=[n,"\n"])}return n}function vt
(e,t,n){var r,i=0;for(r=e;r<t;r++)x[r]==="\n"&&i++;for(r=1;r<i;r++)n.push(d)}function mt
(e,t,n){return t<n?["(",e,")"]:e}function gt(e){var t,n,r;r=e.split(/\r\n|\n/);for(
t=1,n=r.length;t<n;t++)r[t]=d+u+r[t];return r}function yt(e,n){var r,i,s;return r=
e[w.verbatim],typeof r=="string"?i=mt(gt(r),t.Sequence,n):(i=gt(r.content),s=r.precedence!=
null?r.precedence:t.Sequence,i=mt(i,s,n)),ot(i,e)}function bt(){}function wt(e){
return ot(e.name,e)}function Et(e,t){return e.async?"async"+(t?ut():v):""}function St
(e){var t=e.generator&&!w.moz.starlessGenerator;return t?"*"+v:""}function xt(e)
{var t=e.value;return t.async?Et(t,!e.computed):St(t)?"*":""}function Tt(e){var n
;n=new bt;if(L(e))return n.generateStatement(e,R);if(k(e))return n.generateExpression
(e,t.Sequence,j);throw new Error("Unknown node type: "+e.type)}function Nt(e,t){
var n=V(),i,s;return t!=null?(typeof t.indent=="string"&&(n.format.indent.style=
t.indent),typeof t.base=="number"&&(n.format.indent.base=t.base),t=G(n,t),a=t.format
.indent.style,typeof t.base=="string"?u=t.base:u=$(a,t.format.indent.base)):(t=n
,a=t.format.indent.style,u=$(a,t.format.indent.base)),f=t.format.json,l=t.format
.renumber,c=f?!1:t.format.hexadecimal,h=f?"double":t.format.quotes,p=t.format.escapeless
,d=t.format.newline,v=t.format.space,t.format.compact&&(d=v=a=u=""),m=t.format.parentheses
,g=t.format.semicolons,y=t.format.safeConcatenation,b=t.directive,E=f?null:t.parse
,S=t.sourceMap,x=t.sourceCode,T=t.format.preserveBlankLines&&x!==null,w=t,S&&(exports
.browser?r=global.sourceMap.SourceNode:r=require("source-map").SourceNode),i=Tt(
e),S?(s=i.toStringWithSourceMap({file:t.file,sourceRoot:t.sourceMapRoot}),t.sourceContent&&
s.map.setSourceContent(t.sourceMap,t.sourceContent),t.sourceMapWithCode?s:s.map.
toString()):(s={code:i.toString(),map:null},t.sourceMapWithCode?s:s.code)}var e,
t,n,r,i,s,o,u,a,f,l,c,h,p,d,v,m,g,y,b,w,E,S,x,T,N,C;i=require("estraverse"),s=require
("esutils"),e=i.Syntax,t={Sequence:0,Yield:1,Await:1,Assignment:1,Conditional:2,
ArrowFunction:2,LogicalOR:3,LogicalAND:4,BitwiseOR:5,BitwiseXOR:6,BitwiseAND:7,Equality
:8,Relational:9,BitwiseSHIFT:10,Additive:11,Multiplicative:12,Unary:13,Postfix:14
,Call:15,New:16,TaggedTemplate:17,Member:18,Primary:19},n={"||":t.LogicalOR,"&&"
:t.LogicalAND,"|":t.BitwiseOR,"^":t.BitwiseXOR,"&":t.BitwiseAND,"==":t.Equality,"!="
:t.Equality,"===":t.Equality,"!==":t.Equality,is:t.Equality,isnt:t.Equality,"<":
t.Relational,">":t.Relational,"<=":t.Relational,">=":t.Relational,"in":t.Relational
,"instanceof":t.Relational,"<<":t.BitwiseSHIFT,">>":t.BitwiseSHIFT,">>>":t.BitwiseSHIFT
,"+":t.Additive,"-":t.Additive,"*":t.Multiplicative,"%":t.Multiplicative,"/":t.Multiplicative
};var A=1,O=2,M=4,_=8,D=16,P=32,H=O|M,B=A|O,j=A|O|M,F=A,I=M,q=A|M,R=A,U=A|P,z=0,
W=A|D,X=A|_;o=Array.isArray,o||(o=function(t){return Object.prototype.toString.call
(t)==="[object Array]"}),bt.prototype.maybeBlock=function(t,n){var r,i,s=this;return i=!
w.comment||!t.leadingComments,t.type===e.BlockStatement&&i?[v,this.generateStatement
(t,n)]:t.type===e.EmptyStatement&&i?";":(lt(function(){r=[d,ft(s.generateStatement
(t,n))]}),r)},bt.prototype.maybeBlockSuffix=function(t,n){var r=K(ot(n).toString
());return t.type===e.BlockStatement&&(!w.comment||!t.leadingComments)&&!r?[n,v]
:r?[n,u]:[n,d,u]},bt.prototype.generatePattern=function(t,n,r){return t.type===e
.Identifier?wt(t):this.generateExpression(t,n,r)},bt.prototype.generateFunctionParams=
function(n){var r,i,s,o;o=!1;if(n.type===e.ArrowFunctionExpression&&!n.rest&&(!n
.defaults||n.defaults.length===0)&&n.params.length===1&&n.params[0].type===e.Identifier
)s=[Et(n,!0),wt(n.params[0])];else{s=n.type===e.ArrowFunctionExpression?[Et(n,!1
)]:[],s.push("("),n.defaults&&(o=!0);for(r=0,i=n.params.length;r<i;++r)o&&n.defaults
[r]?s.push(this.generateAssignment(n.params[r],n.defaults[r],"=",t.Assignment,j)
):s.push(this.generatePattern(n.params[r],t.Assignment,j)),r+1<i&&s.push(","+v);
n.rest&&(n.params.length&&s.push(","+v),s.push("..."),s.push(wt(n.rest))),s.push
(")")}return s},bt.prototype.generateFunctionBody=function(n){var r,i;return r=this
.generateFunctionParams(n),n.type===e.ArrowFunctionExpression&&(r.push(v),r.push
("=>")),n.expression?(r.push(v),i=this.generateExpression(n.body,t.Assignment,j)
,i.toString().charAt(0)==="{"&&(i=["(",i,")"]),r.push(i)):r.push(this.maybeBlock
(n.body,X)),r},bt.prototype.generateIterationForStatement=function(n,r,i){var s=
["for"+v+"("],o=this;return lt(function(){r.left.type===e.VariableDeclaration?lt
(function(){s.push(r.left.kind+ut()),s.push(o.generateStatement(r.left.declarations
[0],z))}):s.push(o.generateExpression(r.left,t.Call,j)),s=at(s,n),s=[at(s,o.generateExpression
(r.right,t.Sequence,j)),")"]}),s.push(this.maybeBlock(r.body,i)),s},bt.prototype
.generatePropertyKey=function(e,n){var r=[];return n&&r.push("["),r.push(this.generateExpression
(e,t.Sequence,j)),n&&r.push("]"),r},bt.prototype.generateAssignment=function(e,n
,r,i,s){return t.Assignment<i&&(s|=A),mt([this.generateExpression(e,t.Call,s),v+
r+v,this.generateExpression(n,t.Assignment,s)],t.Assignment,i)},bt.prototype.semicolon=
function(e){return!g&&e&P?"":";"},bt.Statement={BlockStatement:function(e,t){var n
,r,i=["{",d],s=this;return lt(function(){e.body.length===0&&T&&(n=e.range,n[1]-n
[0]>2&&(r=x.substring(n[0]+1,n[1]-1),r[0]==="\n"&&(i=["{"]),i.push(r)));var o,u,
a,f;f=R,t&_&&(f|=D);for(o=0,u=e.body.length;o<u;++o)T&&(o===0&&(e.body[0].leadingComments&&
(n=e.body[0].leadingComments[0].extendedRange,r=x.substring(n[0],n[1]),r[0]==="\n"&&
(i=["{"])),e.body[0].leadingComments||vt(e.range[0],e.body[0].range[0],i)),o>0&&!
e.body[o-1].trailingComments&&!e.body[o].leadingComments&&vt(e.body[o-1].range[1
],e.body[o].range[0],i)),o===u-1&&(f|=P),e.body[o].leadingComments&&T?a=s.generateStatement
(e.body[o],f):a=ft(s.generateStatement(e.body[o],f)),i.push(a),K(ot(a).toString(
))||(T&&o<u-1?e.body[o+1].leadingComments||i.push(d):i.push(d)),T&&o===u-1&&(e.body
[o].trailingComments||vt(e.body[o].range[1],e.range[1],i))}),i.push(ft("}")),i},
BreakStatement:function(e,t){return e.label?"break "+e.label.name+this.semicolon
(t):"break"+this.semicolon(t)},ContinueStatement:function(e,t){return e.label?"continue "+
e.label.name+this.semicolon(t):"continue"+this.semicolon(t)},ClassBody:function(
e,n){var r=["{",d],i=this;return lt(function(n){var s,o;for(s=0,o=e.body.length;
s<o;++s)r.push(n),r.push(i.generateExpression(e.body[s],t.Sequence,j)),s+1<o&&r.
push(d)}),K(ot(r).toString())||r.push(d),r.push(u),r.push("}"),r},ClassDeclaration
:function(e,n){var r,i;return r=["class "+e.id.name],e.superClass&&(i=at("extends"
,this.generateExpression(e.superClass,t.Assignment,j)),r=at(r,i)),r.push(v),r.push
(this.generateStatement(e.body,U)),r},DirectiveStatement:function(e,t){return w.
raw&&e.raw?e.raw+this.semicolon(t):rt(e.directive)+this.semicolon(t)},DoWhileStatement
:function(e,n){var r=at("do",this.maybeBlock(e.body,R));return r=this.maybeBlockSuffix
(e.body,r),at(r,["while"+v+"(",this.generateExpression(e.test,t.Sequence,j),")"+
this.semicolon(n)])},CatchClause:function(e,n){var r,i=this;return lt(function()
{var n;r=["catch"+v+"(",i.generateExpression(e.param,t.Sequence,j),")"],e.guard&&
(n=i.generateExpression(e.guard,t.Sequence,j),r.splice(2,0," if ",n))}),r.push(this
.maybeBlock(e.body,R)),r},DebuggerStatement:function(e,t){return"debugger"+this.
semicolon(t)},EmptyStatement:function(e,t){return";"},ExportDeclaration:function(
n,r){var i=["export"],s,o=this;return s=r&P?U:R,n["default"]?(i=at(i,"default"),
L(n.declaration)?i=at(i,this.generateStatement(n.declaration,s)):i=at(i,this.generateExpression
(n.declaration,t.Assignment,j)+this.semicolon(r)),i):n.declaration?at(i,this.generateStatement
(n.declaration,s)):(n.specifiers&&(n.specifiers.length===0?i=at(i,"{"+v+"}"):n.specifiers
[0].type===e.ExportBatchSpecifier?i=at(i,this.generateExpression(n.specifiers[0]
,t.Sequence,j)):(i=at(i,"{"),lt(function(e){var r,s;i.push(d);for(r=0,s=n.specifiers
.length;r<s;++r)i.push(e),i.push(o.generateExpression(n.specifiers[r],t.Sequence
,j)),r+1<s&&i.push(","+d)}),K(ot(i).toString())||i.push(d),i.push(u+"}")),n.source?
i=at(i,["from"+v,this.generateExpression(n.source,t.Sequence,j),this.semicolon(r
)]):i.push(this.semicolon(r))),i)},ExportDefaultDeclaration:function(e,t){return e
.default=!0,this.ExportDeclaration(e,t)},ExportNamedDeclaration:function(e,t){return this
.ExportDeclaration(e,t)},ExpressionStatement:function(n,r){function u(e){var t;return e
.slice(0,5)!=="class"?!1:(t=e.charCodeAt(5),t===123||s.code.isWhiteSpace(t)||s.code
.isLineTerminator(t))}function a(e){var t;return e.slice(0,8)!=="function"?!1:(t=
e.charCodeAt(8),t===40||s.code.isWhiteSpace(t)||t===42||s.code.isLineTerminator(
t))}function f(e){var t,n,r;if(e.slice(0,5)!=="async")return!1;if(!s.code.isWhiteSpace
(e.charCodeAt(5)))return!1;for(n=6,r=e.length;n<r;++n)if(!s.code.isWhiteSpace(e.
charCodeAt(n)))break;return n===r?!1:e.slice(n,n+8)!=="function"?!1:(t=e.charCodeAt
(n+8),t===40||s.code.isWhiteSpace(t)||t===42||s.code.isLineTerminator(t))}var i,
o;return i=[this.generateExpression(n.expression,t.Sequence,j)],o=ot(i).toString
(),o.charCodeAt(0)===123||u(o)||a(o)||f(o)||b&&r&D&&n.expression.type===e.Literal&&typeof
n.expression.value=="string"?i=["(",i,")"+this.semicolon(r)]:i.push(this.semicolon
(r)),i},ImportDeclaration:function(n,r){var i,s,o=this;return n.specifiers.length===0?
["import",v,this.generateExpression(n.source,t.Sequence,j),this.semicolon(r)]:(i=
["import"],s=0,n.specifiers[s].type===e.ImportDefaultSpecifier&&(i=at(i,[this.generateExpression
(n.specifiers[s],t.Sequence,j)]),++s),n.specifiers[s]&&(s!==0&&i.push(","),n.specifiers
[s].type===e.ImportNamespaceSpecifier?i=at(i,[v,this.generateExpression(n.specifiers
[s],t.Sequence,j)]):(i.push(v+"{"),n.specifiers.length-s===1?(i.push(v),i.push(this
.generateExpression(n.specifiers[s],t.Sequence,j)),i.push(v+"}"+v)):(lt(function(
e){var r,u;i.push(d);for(r=s,u=n.specifiers.length;r<u;++r)i.push(e),i.push(o.generateExpression
(n.specifiers[r],t.Sequence,j)),r+1<u&&i.push(","+d)}),K(ot(i).toString())||i.push
(d),i.push(u+"}"+v)))),i=at(i,["from"+v,this.generateExpression(n.source,t.Sequence
,j),this.semicolon(r)]),i)},VariableDeclarator:function(e,n){var r=n&A?j:H;return e
.init?[this.generateExpression(e.id,t.Assignment,r),v,"=",v,this.generateExpression
(e.init,t.Assignment,r)]:this.generatePattern(e.id,t.Assignment,r)},VariableDeclaration
:function(e,t){function a(){s=e.declarations[0],w.comment&&s.leadingComments?(n.
push("\n"),n.push(ft(u.generateStatement(s,o)))):(n.push(ut()),n.push(u.generateStatement
(s,o)));for(r=1,i=e.declarations.length;r<i;++r)s=e.declarations[r],w.comment&&s
.leadingComments?(n.push(","+d),n.push(ft(u.generateStatement(s,o)))):(n.push(","+
v),n.push(u.generateStatement(s,o)))}var n,r,i,s,o,u=this;return n=[e.kind],o=t&
A?R:z,e.declarations.length>1?lt(a):a(),n.push(this.semicolon(t)),n},ThrowStatement
:function(e,n){return[at("throw",this.generateExpression(e.argument,t.Sequence,j
)),this.semicolon(n)]},TryStatement:function(e,t){var n,r,i,s;n=["try",this.maybeBlock
(e.block,R)],n=this.maybeBlockSuffix(e.block,n);if(e.handlers)for(r=0,i=e.handlers
.length;r<i;++r){n=at(n,this.generateStatement(e.handlers[r],R));if(e.finalizer||
r+1!==i)n=this.maybeBlockSuffix(e.handlers[r].body,n)}else{s=e.guardedHandlers||
[];for(r=0,i=s.length;r<i;++r){n=at(n,this.generateStatement(s[r],R));if(e.finalizer||
r+1!==i)n=this.maybeBlockSuffix(s[r].body,n)}if(e.handler)if(o(e.handler))for(r=0
,i=e.handler.length;r<i;++r){n=at(n,this.generateStatement(e.handler[r],R));if(e
.finalizer||r+1!==i)n=this.maybeBlockSuffix(e.handler[r].body,n)}else n=at(n,this
.generateStatement(e.handler,R)),e.finalizer&&(n=this.maybeBlockSuffix(e.handler
.body,n))}return e.finalizer&&(n=at(n,["finally",this.maybeBlock(e.finalizer,R)]
)),n},SwitchStatement:function(e,n){var r,i,s,o,u,a=this;lt(function(){r=["switch"+
v+"(",a.generateExpression(e.discriminant,t.Sequence,j),")"+v+"{"+d]});if(e.cases
){u=R;for(s=0,o=e.cases.length;s<o;++s)s===o-1&&(u|=P),i=ft(this.generateStatement
(e.cases[s],u)),r.push(i),K(ot(i).toString())||r.push(d)}return r.push(ft("}")),
r},SwitchCase:function(n,r){var i,s,o,u,a,f=this;return lt(function(){n.test?i=[
at("case",f.generateExpression(n.test,t.Sequence,j)),":"]:i=["default:"],o=0,u=n
.consequent.length,u&&n.consequent[0].type===e.BlockStatement&&(s=f.maybeBlock(n
.consequent[0],R),i.push(s),o=1),o!==u&&!K(ot(i).toString())&&i.push(d),a=R;for(
;o<u;++o)o===u-1&&r&P&&(a|=P),s=ft(f.generateStatement(n.consequent[o],a)),i.push
(s),o+1!==u&&!K(ot(s).toString())&&i.push(d)}),i},IfStatement:function(n,r){var i
,s,o,u=this;return lt(function(){i=["if"+v+"(",u.generateExpression(n.test,t.Sequence
,j),")"]}),o=r&P,s=R,o&&(s|=P),n.alternate?(i.push(this.maybeBlock(n.consequent,
R)),i=this.maybeBlockSuffix(n.consequent,i),n.alternate.type===e.IfStatement?i=at
(i,["else ",this.generateStatement(n.alternate,s)]):i=at(i,at("else",this.maybeBlock
(n.alternate,s)))):i.push(this.maybeBlock(n.consequent,s)),i},ForStatement:function(
n,r){var i,s=this;return lt(function(){i=["for"+v+"("],n.init?n.init.type===e.VariableDeclaration?
i.push(s.generateStatement(n.init,z)):(i.push(s.generateExpression(n.init,t.Sequence
,H)),i.push(";")):i.push(";"),n.test?(i.push(v),i.push(s.generateExpression(n.test
,t.Sequence,j)),i.push(";")):i.push(";"),n.update?(i.push(v),i.push(s.generateExpression
(n.update,t.Sequence,j)),i.push(")")):i.push(")")}),i.push(this.maybeBlock(n.body
,r&P?U:R)),i},ForInStatement:function(e,t){return this.generateIterationForStatement
("in",e,t&P?U:R)},ForOfStatement:function(e,t){return this.generateIterationForStatement
("of",e,t&P?U:R)},LabeledStatement:function(e,t){return[e.label.name+":",this.maybeBlock
(e.body,t&P?U:R)]},Program:function(e,t){var n,r,i,s,o;s=e.body.length,n=[y&&s>0?"\n"
:""],o=W;for(i=0;i<s;++i)!y&&i===s-1&&(o|=P),T&&(i===0&&(e.body[0].leadingComments||
vt(e.range[0],e.body[i].range[0],n)),i>0&&!e.body[i-1].trailingComments&&!e.body
[i].leadingComments&&vt(e.body[i-1].range[1],e.body[i].range[0],n)),r=ft(this.generateStatement
(e.body[i],o)),n.push(r),i+1<s&&!K(ot(r).toString())&&(T?e.body[i+1].leadingComments||
n.push(d):n.push(d)),T&&i===s-1&&(e.body[i].trailingComments||vt(e.body[i].range
[1],e.range[1],n));return n},FunctionDeclaration:function(e,t){return[Et(e,!0),"function"
,St(e)||ut(),wt(e.id),this.generateFunctionBody(e)]},ReturnStatement:function(e,
n){return e.argument?[at("return",this.generateExpression(e.argument,t.Sequence,
j)),this.semicolon(n)]:["return"+this.semicolon(n)]},WhileStatement:function(e,n
){var r,i=this;return lt(function(){r=["while"+v+"(",i.generateExpression(e.test
,t.Sequence,j),")"]}),r.push(this.maybeBlock(e.body,n&P?U:R)),r},WithStatement:function(
e,n){var r,i=this;return lt(function(){r=["with"+v+"(",i.generateExpression(e.object
,t.Sequence,j),")"]}),r.push(this.maybeBlock(e.body,n&P?U:R)),r}},Q(bt.prototype
,bt.Statement),bt.Expression={SequenceExpression:function(e,n,r){var i,s,o;t.Sequence<
n&&(r|=A),i=[];for(s=0,o=e.expressions.length;s<o;++s)i.push(this.generateExpression
(e.expressions[s],t.Assignment,r)),s+1<o&&i.push(","+v);return mt(i,t.Sequence,n
)},AssignmentExpression:function(e,t,n){return this.generateAssignment(e.left,e.
right,e.operator,t,n)},ArrowFunctionExpression:function(e,n,r){return mt(this.generateFunctionBody
(e),t.ArrowFunction,n)},ConditionalExpression:function(e,n,r){return t.Conditional<
n&&(r|=A),mt([this.generateExpression(e.test,t.LogicalOR,r),v+"?"+v,this.generateExpression
(e.consequent,t.Assignment,r),v+":"+v,this.generateExpression(e.alternate,t.Assignment
,r)],t.Conditional,n)},LogicalExpression:function(e,t,n){return this.BinaryExpression
(e,t,n)},BinaryExpression:function(e,t,r){var i,o,u,a;return o=n[e.operator],o<t&&
(r|=A),u=this.generateExpression(e.left,o,r),a=u.toString(),a.charCodeAt(a.length-1
)===47&&s.code.isIdentifierPartES5(e.operator.charCodeAt(0))?i=[u,ut(),e.operator
]:i=at(u,e.operator),u=this.generateExpression(e.right,o+1,r),e.operator==="/"&&
u.toString().charAt(0)==="/"||e.operator.slice(-1)==="<"&&u.toString().slice(0,3
)==="!--"?(i.push(ut()),i.push(u)):i=at(i,u),e.operator==="in"&&!(r&A)?["(",i,")"
]:mt(i,o,t)},CallExpression:function(e,n,r){var i,s,o;i=[this.generateExpression
(e.callee,t.Call,B)],i.push("(");for(s=0,o=e.arguments.length;s<o;++s)i.push(this
.generateExpression(e.arguments[s],t.Assignment,j)),s+1<o&&i.push(","+v);return i
.push(")"),r&O?mt(i,t.Call,n):["(",i,")"]},NewExpression:function(e,n,r){var i,s
,o,u,a;s=e.arguments.length,a=r&M&&!m&&s===0?q:F,i=at("new",this.generateExpression
(e.callee,t.New,a));if(!(r&M)||m||s>0){i.push("(");for(o=0,u=s;o<u;++o)i.push(this
.generateExpression(e.arguments[o],t.Assignment,j)),o+1<u&&i.push(","+v);i.push(")"
)}return mt(i,t.New,n)},MemberExpression:function(n,r,i){var o,u;return o=[this.
generateExpression(n.object,t.Call,i&O?B:F)],n.computed?(o.push("["),o.push(this
.generateExpression(n.property,t.Sequence,i&O?j:q)),o.push("]")):(n.object.type===
e.Literal&&typeof n.object.value=="number"&&(u=ot(o).toString(),u.indexOf(".")<0&&!/[eExX]/
.test(u)&&s.code.isDecimalDigit(u.charCodeAt(u.length-1))&&!(u.length>=2&&u.charCodeAt
(0)===48)&&o.push(".")),o.push("."),o.push(wt(n.property))),mt(o,t.Member,r)},UnaryExpression
:function(e,n,r){var i,o,u,a,f;return o=this.generateExpression(e.argument,t.Unary
,j),v===""?i=at(e.operator,o):(i=[e.operator],e.operator.length>2?i=at(i,o):(a=ot
(i).toString(),f=a.charCodeAt(a.length-1),u=o.toString().charCodeAt(0),(f===43||
f===45)&&f===u||s.code.isIdentifierPartES5(f)&&s.code.isIdentifierPartES5(u)?(i.
push(ut()),i.push(o)):i.push(o))),mt(i,t.Unary,n)},YieldExpression:function(e,n,
r){var i;return e.delegate?i="yield*":i="yield",e.argument&&(i=at(i,this.generateExpression
(e.argument,t.Yield,j))),mt(i,t.Yield,n)},AwaitExpression:function(e,n,r){var i=
at(e.all?"await*":"await",this.generateExpression(e.argument,t.Await,j));return mt
(i,t.Await,n)},UpdateExpression:function(e,n,r){return e.prefix?mt([e.operator,this
.generateExpression(e.argument,t.Unary,j)],t.Unary,n):mt([this.generateExpression
(e.argument,t.Postfix,j),e.operator],t.Postfix,n)},FunctionExpression:function(e
,t,n){var r=[Et(e,!0),"function"];return e.id?(r.push(St(e)||ut()),r.push(wt(e.id
))):r.push(St(e)||v),r.push(this.generateFunctionBody(e)),r},ExportBatchSpecifier
:function(e,t,n){return"*"},ArrayPattern:function(e,t,n){return this.ArrayExpression
(e,t,n,!0)},ArrayExpression:function(e,n,r,i){var s,o,a=this;return e.elements.length?
(o=i?!1:e.elements.length>1,s=["[",o?d:""],lt(function(n){var r,i;for(r=0,i=e.elements
.length;r<i;++r)e.elements[r]?(s.push(o?n:""),s.push(a.generateExpression(e.elements
[r],t.Assignment,j))):(o&&s.push(n),r+1===i&&s.push(",")),r+1<i&&s.push(","+(o?d
:v))}),o&&!K(ot(s).toString())&&s.push(d),s.push(o?u:""),s.push("]"),s):"[]"},RestElement
:function(e,t,n){return"..."+this.generatePattern(e.argument)},ClassExpression:function(
e,n,r){var i,s;return i=["class"],e.id&&(i=at(i,this.generateExpression(e.id,t.Sequence
,j))),e.superClass&&(s=at("extends",this.generateExpression(e.superClass,t.Assignment
,j)),i=at(i,s)),i.push(v),i.push(this.generateStatement(e.body,U)),i},MethodDefinition
:function(e,t,n){var r,i;return e["static"]?r=["static"+v]:r=[],e.kind==="get"||
e.kind==="set"?i=[at(e.kind,this.generatePropertyKey(e.key,e.computed)),this.generateFunctionBody
(e.value)]:i=[xt(e),this.generatePropertyKey(e.key,e.computed),this.generateFunctionBody
(e.value)],at(r,i)},Property:function(e,n,r){return e.kind==="get"||e.kind==="set"?
[e.kind,ut(),this.generatePropertyKey(e.key,e.computed),this.generateFunctionBody
(e.value)]:e.shorthand?this.generatePropertyKey(e.key,e.computed):e.method?[xt(e
),this.generatePropertyKey(e.key,e.computed),this.generateFunctionBody(e.value)]
:[this.generatePropertyKey(e.key,e.computed),":"+v,this.generateExpression(e.value
,t.Assignment,j)]},ObjectExpression:function(e,n,r){var i,s,o,a=this;return e.properties
.length?(i=e.properties.length>1,lt(function(){o=a.generateExpression(e.properties
[0],t.Sequence,j)}),!i&&!J(ot(o).toString())?["{",v,o,v,"}"]:(lt(function(n){var r
,u;s=["{",d,n,o];if(i){s.push(","+d);for(r=1,u=e.properties.length;r<u;++r)s.push
(n),s.push(a.generateExpression(e.properties[r],t.Sequence,j)),r+1<u&&s.push(","+
d)}}),K(ot(s).toString())||s.push(d),s.push(u),s.push("}"),s)):"{}"},ObjectPattern
:function(n,r,i){var s,o,a,f,l,c=this;if(!n.properties.length)return"{}";f=!1;if(
n.properties.length===1)l=n.properties[0],l.value.type!==e.Identifier&&(f=!0);else for(
o=0,a=n.properties.length;o<a;++o){l=n.properties[o];if(!l.shorthand){f=!0;break}
}return s=["{",f?d:""],lt(function(e){var r,i;for(r=0,i=n.properties.length;r<i;++
r)s.push(f?e:""),s.push(c.generateExpression(n.properties[r],t.Sequence,j)),r+1<
i&&s.push(","+(f?d:v))}),f&&!K(ot(s).toString())&&s.push(d),s.push(f?u:""),s.push
("}"),s},ThisExpression:function(e,t,n){return"this"},Super:function(e,t,n){return"super"
},Identifier:function(e,t,n){return wt(e)},ImportDefaultSpecifier:function(e,t,n
){return wt(e.id||e.local)},ImportNamespaceSpecifier:function(e,t,n){var r=["*"]
,i=e.id||e.local;return i&&r.push(v+"as"+ut()+wt(i)),r},ImportSpecifier:function(
e,t,n){return this.ExportSpecifier(e,t,n)},ExportSpecifier:function(e,t,n){var r=
(e.id||e.imported).name,i=[r],s=e.name||e.local;return s&&s.name!==r&&i.push(ut(
)+"as"+ut()+wt(s)),i},Literal:function(t,n,r){var i;if(t.hasOwnProperty("raw")&&
E&&w.raw)try{i=E(t.raw).body[0].expression;if(i.type===e.Literal&&i.value===t.value
)return t.raw}catch(s){}return t.value===null?"null":typeof t.value=="string"?it
(t.value):typeof t.value=="number"?Y(t.value):typeof t.value=="boolean"?t.value?"true"
:"false":et(t.value)},GeneratorExpression:function(e,t,n){return this.ComprehensionExpression
(e,t,n)},ComprehensionExpression:function(n,r,i){var s,o,u,a,f=this;return s=n.type===
e.GeneratorExpression?["("]:["["],w.moz.comprehensionExpressionStartsWithAssignment&&
(a=this.generateExpression(n.body,t.Assignment,j),s.push(a)),n.blocks&&lt(function(
){for(o=0,u=n.blocks.length;o<u;++o)a=f.generateExpression(n.blocks[o],t.Sequence
,j),o>0||w.moz.comprehensionExpressionStartsWithAssignment?s=at(s,a):s.push(a)})
,n.filter&&(s=at(s,"if"+v),a=this.generateExpression(n.filter,t.Sequence,j),s=at
(s,["(",a,")"])),w.moz.comprehensionExpressionStartsWithAssignment||(a=this.generateExpression
(n.body,t.Assignment,j),s=at(s,a)),s.push(n.type===e.GeneratorExpression?")":"]"
),s},ComprehensionBlock:function(n,r,i){var s;return n.left.type===e.VariableDeclaration?
s=[n.left.kind,ut(),this.generateStatement(n.left.declarations[0],z)]:s=this.generateExpression
(n.left,t.Call,j),s=at(s,n.of?"of":"in"),s=at(s,this.generateExpression(n.right,
t.Sequence,j)),["for"+v+"(",s,")"]},SpreadElement:function(e,n,r){return["...",this
.generateExpression(e.argument,t.Assignment,j)]},TaggedTemplateExpression:function(
e,n,r){var i=B;r&O||(i=F);var s=[this.generateExpression(e.tag,t.Call,i),this.generateExpression
(e.quasi,t.Primary,I)];return mt(s,t.TaggedTemplate,n)},TemplateElement:function(
e,t,n){return e.value.raw},TemplateLiteral:function(e,n,r){var i,s,o;i=["`"];for(
s=0,o=e.quasis.length;s<o;++s)i.push(this.generateExpression(e.quasis[s],t.Primary
,j)),s+1<o&&(i.push("${"+v),i.push(this.generateExpression(e.expressions[s],t.Sequence
,j)),i.push(v+"}"));return i.push("`"),i},ModuleSpecifier:function(e,t,n){return this
.Literal(e,t,n)}},Q(bt.prototype,bt.Expression),bt.prototype.generateExpression=
function(t,n,r){var i,s;return s=t.type||e.Property,w.verbatim&&t.hasOwnProperty
(w.verbatim)?yt(t,n):(i=this[s](t,n,r),w.comment&&(i=dt(t,i)),ot(i,t))},bt.prototype
.generateStatement=function(t,n){var r,i;return r=this[t.type](t,n),w.comment&&(
r=dt(t,r)),i=ot(r).toString(),t.type===e.Program&&!y&&d===""&&i.charAt(i.length-1
)==="\n"&&(r=S?ot(r).replaceRight(/\s+$/,""):i.replace(/\s+$/,"")),ot(r,t)},N={indent
:{style:"",base:0},renumber:!0,hexadecimal:!0,quotes:"auto",escapeless:!0,compact
:!0,parentheses:!1,semicolons:!1},C=V().format,exports.version=require("./package.json"
).version,exports.generate=Nt,exports.attachComments=i.attachComments,exports.Precedence=
G({},t),exports.browser=!1,exports.FORMAT_MINIFY=N,exports.FORMAT_DEFAULTS=C})()
}());
/* jslint-ignore-end */



    // init lib handlebars
    (function () {
        // https://github.com/components/handlebars.js/blob/v1.2.1/handlebars.js
        local.handlebars = {};
        local.handlebars.compile = function (template) {
        /*
         * this function will return a function that will render the template with a given dict
         */
            return function (dict) {
                var result;
                result = template;
                // render triple-curly-brace
                result = result.replace((/\{\{\{/g), '{{').replace((/\}\}\}/g), '}}');
                // render with-statement
                result = result.replace(
                    (/\{\{#with (.+?)\}\}([\S\s]+?)\{\{\/with\}\}/g),
                    function (match0, match1, match2) {
                        // jslint-hack
                        local.nop(match0);
                        return local.handlebars.replace(match2, dict, match1 + '.');
                    }
                );
                // render helper
                result = result.replace(
                    '{{#show_ignores metrics}}{{/show_ignores}}',
                    function () {
                        return local.handlebars.show_ignores(dict.metrics);
                    }
                );
                result = result.replace('{{#show_line_execution_counts fileCoverage}}' +
                    '{{maxLines}}{{/show_line_execution_counts}}', function () {
                        return local.handlebars.show_line_execution_counts(
                            dict.fileCoverage,
                            { fn: function () {
                                return dict.maxLines;
                            } }
                        );
                    });
                result = result.replace(
                    '{{#show_lines}}{{maxLines}}{{/show_lines}}',
                    function () {
                        return local.handlebars.show_lines({ fn: function () {
                            return dict.maxLines;
                        } });
                    }
                );
                result = result.replace(
                    '{{#show_picture}}{{metrics.statements.pct}}{{/show_picture}}',
                    function () {
                        return local.handlebars.show_picture({ fn: function () {
                            return dict.metrics.statements.pct;
                        } });
                    }
                );
                result = local.handlebars.replace(result, dict, '');
                // show code last
                result = result.replace(
                    '{{#show_code structured}}{{/show_code}}',
                    function () {
                        return local.handlebars.show_code(dict.structured);
                    }
                );
                return result;
            };
        };
        local.handlebars.registerHelper = function (key, helper) {
        /*
         * this function will register the helper-function
         */
            local.handlebars[key] = function () {
                try {
                    return helper.apply(null, arguments);
                } catch (ignore) {
                }
            };
        };
        local.handlebars.replace = function (template, dict, withPrefix) {
        /*
         * this function will replace the keys in the template with the dict's key / value
         */
            var value;
            // search for keys in the template
            return template.replace((/\{\{.+?\}\}/g), function (match0) {
                value = dict;
                // iteratively lookup nested values in the dict
                (withPrefix + match0.slice(2, -2)).split('.').forEach(function (key) {
                    value = value && value[key];
                });
                return value === undefined
                    ? match0
                    : String(value);
            });
        };
    }());



    // init lib istanbul.collector
    (function () {
        // https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/collector.js
        local.collector = {
            fileCoverageFor: function (file) {
                return local.global.__coverage__[file];
            },
            files: function () {
                return Object.keys(local.global.__coverage__).filter(function (key) {
                    if (local.global.__coverage__[key] &&
                            local.global.__coverageCodeDict__[key]) {
                        // reset derived info
                        local.global.__coverage__[key].l = null;
                        return true;
                    }
                });
            }
        };
    }());



/* istanbul ignore next */
// init lib istanbul.insertion-text
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/util/insertion-text.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/util/insertion-text.js
(function () { var module; module = {};
function InsertionText(e,t){this.text=e,this.origLength=e.length,this.offsets=[]
,this.consumeBlanks=t,this.startPos=this.findFirstNonBlank(),this.endPos=this.findLastNonBlank
()}var WHITE_RE=/[ \f\n\r\t\v\u00A0\u2028\u2029]/;InsertionText.prototype={findFirstNonBlank
:function(){var e=-1,t=this.text,n=t.length,r;for(r=0;r<n;r+=1)if(!t.charAt(r).match
(WHITE_RE)){e=r;break}return e},findLastNonBlank:function(){var e=this.text,t=e.
length,n=e.length+1,r;for(r=t-1;r>=0;r-=1)if(!e.charAt(r).match(WHITE_RE)){n=r;break}
return n},originalLength:function(){return this.origLength},insertAt:function(e,
t,n,r){r=typeof r=="undefined"?this.consumeBlanks:r,e=e>this.originalLength()?this
.originalLength():e,e=e<0?0:e,r&&(e<=this.startPos&&(e=0),e>this.endPos&&(e=this
.origLength));var i=t.length,s=this.findOffset(e,i,n),o=e+s,u=this.text;return this
.text=u.substring(0,o)+t+u.substring(o),this},findOffset:function(e,t,n){var r=this
.offsets,i,s=0,o;for(o=0;o<r.length;o+=1){i=r[o];if(i.pos<e||i.pos===e&&!n)s+=i.
len;if(i.pos>=e)break}return i&&i.pos===e?i.len+=t:r.splice(o,0,{pos:e,len:t}),s
},wrap:function(e,t,n,r,i){return this.insertAt(e,t,!0,i),this.insertAt(n,r,!1,i
),this},wrapLine:function(e,t){this.wrap(0,e,this.originalLength(),t)},toString:
function(){return this.text}},module.exports=InsertionText
local['../util/insertion-text'] = module.exports; }());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib istanbul.instrumenter
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.3.20/lib/instrumenter.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.3.20/lib/instrumenter.js
// replace '(t?"":r)' with 'Math.random().toString(16).slice(2)'
(function () { var escodegen, esprima, module, window; escodegen = local.escodegen; esprima = local.esprima; module = undefined; window = local;
(function(e){"use strict";function p(e,t){var n,r;return s!==null?(n=s.createHash
("md5"),n.update(e),r=n.digest("base64"),r=r.replace(new RegExp("=","g"),"").replace
(new RegExp("\\+","g"),"_").replace(new RegExp("/","g"),"$")):(window.__cov_seq=
window.__cov_seq||0,window.__cov_seq+=1,r=window.__cov_seq),"__cov_"+Math.random().toString(16).slice(2)}function d
(e,t){h(t)||(t=[t]),Array.prototype.push.apply(e,t)}function v(e,t,n,r){this.walkMap=
e,this.preprocessor=t,this.scope=n,this.debug=r,this.debug&&(this.level=0,this.seq=!0
)}function m(e,n){var r=e.type,i,s,o=t[r],u=!!e.loc||e.type===t.Program.name,a=u?
n.walkMap[r]:null,f,l,c,p,v,m,g,y,b,w,E;if(!t[r]){console.error(e),console.error
("Unsupported node type:"+r);return}o=t[r].children;if(e.walking)throw new Error
("Infinite regress: Custom walkers may NOT call walker.apply(node)");e.walking=!0
,m=n.apply(e,n.preprocessor),i=m.preprocessor,i&&(delete m.preprocessor,m=n.apply
(e,i));if(h(a))for(c=0;c<a.length;c+=1){E=c===a.length-1,m=n.apply(m,a[c]);if(m.
type!==r&&!E)throw new Error("Only the last walker is allowed to change the node type: [type was: "+
r+" ]")}else a&&(m=n.apply(e,a));for(f=0;f<o.length;f+=1){p=o[f],v=e[p];if(v&&!v
.skipWalk){b={node:e,property:p};if(h(v)){g=[];for(l=0;l<v.length;l+=1)y=v[l],b.
index=l,y?(w=n.apply(y,null,b),h(w.prepend)&&(d(g,w.prepend),delete w.prepend)):
w=undefined,d(g,w);e[p]=g}else{w=n.apply(v,null,b);if(h(w.prepend))throw new Error
("Internal error: attempt to prepend statements in disallowed (non-array) context"
);e[p]=w}}}return s=m.postprocessor,s&&(delete m.postprocessor,m=n.apply(m,s)),delete
e.walking,m}function g(e){this.opts=e||{debug:!1,walkDebug:!1,coverageVariable:"__coverage__"
,codeGenerationOptions:undefined,noAutoWrap:!1,noCompact:!1,embedSource:!1,preserveComments
:!1},this.walker=new v({ArrowFunctionExpression:[this.arrowBlockConverter],ExpressionStatement
:this.coverStatement,BreakStatement:this.coverStatement,ContinueStatement:this.coverStatement
,DebuggerStatement:this.coverStatement,ReturnStatement:this.coverStatement,ThrowStatement
:this.coverStatement,TryStatement:[this.paranoidHandlerCheck,this.coverStatement
],VariableDeclaration:this.coverStatement,IfStatement:[this.ifBlockConverter,this
.coverStatement,this.ifBranchInjector],ForStatement:[this.skipInit,this.loopBlockConverter
,this.coverStatement],ForInStatement:[this.skipLeft,this.loopBlockConverter,this
.coverStatement],ForOfStatement:[this.skipLeft,this.loopBlockConverter,this.coverStatement
],WhileStatement:[this.loopBlockConverter,this.coverStatement],DoWhileStatement:
[this.loopBlockConverter,this.coverStatement],SwitchStatement:[this.coverStatement
,this.switchBranchInjector],SwitchCase:[this.switchCaseInjector],WithStatement:[
this.withBlockConverter,this.coverStatement],FunctionDeclaration:[this.coverFunction
,this.coverStatement],FunctionExpression:this.coverFunction,LabeledStatement:this
.coverStatement,ConditionalExpression:this.conditionalBranchInjector,LogicalExpression
:this.logicalExpressionBranchInjector,ObjectExpression:this.maybeAddType},this.extractCurrentHint
,this,this.opts.walkDebug),this.opts.backdoor&&this.opts.backdoor.omitTrackerSuffix&&
(this.omitTrackerSuffix=!0)}var t,n,r=e?require("esprima"):esprima,i=e?require("escodegen"
):escodegen,s=e?require("crypto"):null,o="(function () { ",u="\n}());",a=/^\s*istanbul\s+ignore\s+(if|else|next)(?=\W|$)/
,f,l,c,h=Array.isArray;h||(h=function(e){return e&&Object.prototype.toString.call
(e)==="[object Array]"});if(!e){l={"Could not find esprima":r,"Could not find escodegen"
:i,"JSON object not in scope":JSON,"Array does not implement push":[].push,"Array does not implement unshift"
:[].unshift};for(c in l)if(l.hasOwnProperty(c)&&!l[c])throw new Error(c)}t={AssignmentExpression
:["left","right"],AssignmentPattern:["left","right"],ArrayExpression:["elements"
],ArrayPattern:["elements"],ArrowFunctionExpression:["params","body"],AwaitExpression
:["argument"],BlockStatement:["body"],BinaryExpression:["left","right"],BreakStatement
:["label"],CallExpression:["callee","arguments"],CatchClause:["param","body"],ClassBody
:["body"],ClassDeclaration:["id","superClass","body"],ClassExpression:["id","superClass"
,"body"],ComprehensionBlock:["left","right"],ComprehensionExpression:["blocks","filter"
,"body"],ConditionalExpression:["test","consequent","alternate"],ContinueStatement
:["label"],DebuggerStatement:[],DirectiveStatement:[],DoWhileStatement:["body","test"
],EmptyStatement:[],ExportAllDeclaration:["source"],ExportDefaultDeclaration:["declaration"
],ExportNamedDeclaration:["declaration","specifiers","source"],ExportSpecifier:["exported"
,"local"],ExpressionStatement:["expression"],ForStatement:["init","test","update"
,"body"],ForInStatement:["left","right","body"],ForOfStatement:["left","right","body"
],FunctionDeclaration:["id","params","body"],FunctionExpression:["id","params","body"
],GeneratorExpression:["blocks","filter","body"],Identifier:[],IfStatement:["test"
,"consequent","alternate"],ImportDeclaration:["specifiers","source"],ImportDefaultSpecifier
:["local"],ImportNamespaceSpecifier:["local"],ImportSpecifier:["imported","local"
],Literal:[],LabeledStatement:["label","body"],LogicalExpression:["left","right"
],MemberExpression:["object","property"],MethodDefinition:["key","value"],ModuleSpecifier
:[],NewExpression:["callee","arguments"],ObjectExpression:["properties"],ObjectPattern
:["properties"],Program:["body"],Property:["key","value"],RestElement:["argument"
],ReturnStatement:["argument"],SequenceExpression:["expressions"],SpreadElement:
["argument"],Super:[],SwitchStatement:["discriminant","cases"],SwitchCase:["test"
,"consequent"],TaggedTemplateExpression:["tag","quasi"],TemplateElement:[],TemplateLiteral
:["quasis","expressions"],ThisExpression:[],ThrowStatement:["argument"],TryStatement
:["block","handler","finalizer"],UnaryExpression:["argument"],UpdateExpression:["argument"
],VariableDeclaration:["declarations"],VariableDeclarator:["id","init"],WhileStatement
:["test","body"],WithStatement:["object","body"],YieldExpression:["argument"]};for(
n in t)t.hasOwnProperty(n)&&(t[n]={name:n,children:t[n]});f={variable:function(e
){return{type:t.Identifier.name,name:e}},stringLiteral:function(e){return{type:t
.Literal.name,value:String(e)}},numericLiteral:function(e){return{type:t.Literal
.name,value:Number(e)}},statement:function(e){return{type:t.ExpressionStatement.
name,expression:e}},dot:function(e,n){return{type:t.MemberExpression.name,computed
:!1,object:e,property:n}},subscript:function(e,n){return{type:t.MemberExpression
.name,computed:!0,object:e,property:n}},postIncrement:function(e){return{type:t.
UpdateExpression.name,operator:"++",prefix:!1,argument:e}},sequence:function(e,n
){return{type:t.SequenceExpression.name,expressions:[e,n]}},returnStatement:function(
e){return{type:t.ReturnStatement.name,argument:e}}},v.prototype={startWalk:function(
e){this.path=[],this.apply(e)},apply:function(e,t,n){var r,i,s,o;t=t||m;if(this.
debug){this.seq+=1,this.level+=1,s=this.seq,o="";for(i=0;i<this.level;i+=1)o+="    "
;console.log(o+"Enter ("+s+"):"+e.type)}return n&&this.path.push(n),r=t.call(this
.scope,e,this),n&&this.path.pop(),this.debug&&(this.level-=1,console.log(o+"Return ("+
s+"):"+e.type)),r||e},startLineForNode:function(e){return e&&e.loc&&e.loc.start?
e.loc.start.line:null},ancestor:function(e){return this.path.length>e-1?this.path
[this.path.length-e]:null},parent:function(){return this.ancestor(1)},isLabeled:
function(){var e=this.parent();return e&&e.node.type===t.LabeledStatement.name}}
,g.prototype={instrumentSync:function(e,n){var s;if(typeof e!="string")throw new
Error("Code must be string");return e.charAt(0)==="#"&&(e="//"+e),this.opts.noAutoWrap||
(e=o+e+u),s=r.parse(e,{loc:!0,range:!0,tokens:this.opts.preserveComments,comment
:!0}),this.opts.preserveComments&&(s=i.attachComments(s,s.comments,s.tokens)),this
.opts.noAutoWrap||(s={type:t.Program.name,body:s.body[0].expression.callee.body.
body,comments:s.comments}),this.instrumentASTSync(s,n,e)},filterHints:function(e
){var t=[],n,r,i;if(!e||!h(e))return t;for(n=0;n<e.length;n+=1)r=e[n],r&&r.value&&
r.range&&h(r.range)&&(i=String(r.value).match(a),i&&t.push({type:i[1],start:r.range
[0],end:r.range[1]}));return t},extractCurrentHint:function(e){if(!e.range)return;
var t=this.currentState.lastHintPosition+1,n=this.currentState.hints,r=e.range[0
],i;this.currentState.currentHint=null;while(t<n.length){i=n[t];if(!(i.end<r))break;
this.currentState.currentHint=i,this.currentState.lastHintPosition=t,t+=1}},instrumentASTSync
:function(e,t,n){var r=!1,s,o,u,a,f;t=t||String((new Date).getTime())+".js",this
.sourceMap=null,this.coverState={path:t,s:{},b:{},f:{},fnMap:{},statementMap:{},
branchMap:{}},this.currentState={trackerVar:p(t,this.omitTrackerSuffix),func:0,branch
:0,variable:0,statement:0,hints:this.filterHints(e.comments),currentHint:null,lastHintPosition
:-1,ignoring:0},e.body&&e.body.length>0&&this.isUseStrictExpression(e.body[0])&&
(e.body.shift(),r=!0),this.walker.startWalk(e),s=this.opts.codeGenerationOptions||
{format:{compact:!this.opts.noCompact}},s.comment=this.opts.preserveComments,o=i
.generate(e,s),u=this.getPreamble(n||"",r);if(o.map&&o.code){a=u.split(/\r\n|\r|\n/
).length;for(f=0;f<o.map._mappings._array.length;f+=1)o.map._mappings._array[f].
generatedLine+=a;this.sourceMap=o.map,o=o.code}return u+"\n"+o+"\n"},instrument:
function(e,t,n){!n&&typeof t=="function"&&(n=t,t=null);try{n(null,this.instrumentSync
(e,t))}catch(r){n(r)}},lastFileCoverage:function(){return this.coverState},lastSourceMap
:function(){return this.sourceMap},fixColumnPositions:function(e){var t=o.length
,n=function(e){e.start.line===1&&(e.start.column-=t),e.end.line===1&&(e.end.column-=
t)},r,i,s,u;i=e.statementMap;for(r in i)i.hasOwnProperty(r)&&n(i[r]);i=e.fnMap;for(
r in i)i.hasOwnProperty(r)&&n(i[r].loc);i=e.branchMap;for(r in i)if(i.hasOwnProperty
(r)){u=i[r].locations;for(s=0;s<u.length;s+=1)n(u[s])}},getPreamble:function(e,t
){var n=this.opts.coverageVariable||"__coverage__",r=this.coverState.path.replace
(/\\/g,"\\\\"),i=this.currentState.trackerVar,s,o=t?'"use strict";':"",u=function(
e){return function(){return e}},a;return this.opts.noAutoWrap||this.fixColumnPositions
(this.coverState),this.opts.embedSource&&(this.coverState.code=e.split(/(?:\r?\n)|\r/
)),s=this.opts.debug?JSON.stringify(this.coverState,undefined,4):JSON.stringify(
this.coverState),a=["%STRICT%","var %VAR% = (Function('return this'))();","if (!%VAR%.%GLOBAL%) { %VAR%.%GLOBAL% = {}; }"
,"%VAR% = %VAR%.%GLOBAL%;","if (!(%VAR%['%FILE%'])) {","   %VAR%['%FILE%'] = %OBJECT%;"
,"}","%VAR% = %VAR%['%FILE%'];"].join("\n").replace(/%STRICT%/g,u(o)).replace(/%VAR%/g
,u(i)).replace(/%GLOBAL%/g,u(n)).replace(/%FILE%/g,u(r)).replace(/%OBJECT%/g,u(s
)),a},startIgnore:function(){this.currentState.ignoring+=1},endIgnore:function()
{this.currentState.ignoring-=1},convertToBlock:function(e){return e?e.type==="BlockStatement"?
e:{type:"BlockStatement",body:[e]}:{type:"BlockStatement",body:[]}},arrowBlockConverter
:function(e){var t;e.expression&&(t=f.returnStatement(e.body),t.loc=e.body.loc,e
.body=this.convertToBlock(t),e.expression=!1)},paranoidHandlerCheck:function(e){!
e.handler&&e.handlers&&(e.handler=e.handlers[0])},ifBlockConverter:function(e){e
.consequent=this.convertToBlock(e.consequent),e.alternate=this.convertToBlock(e.
alternate)},loopBlockConverter:function(e){e.body=this.convertToBlock(e.body)},withBlockConverter
:function(e){e.body=this.convertToBlock(e.body)},statementName:function(e,t){var n
,r=!!this.currentState.ignoring;return e.skip=r||undefined,t=t||0,this.currentState
.statement+=1,n=this.currentState.statement,this.coverState.statementMap[n]=e,this
.coverState.s[n]=t,n},skipInit:function(e){e.init&&(e.init.skipWalk=!0)},skipLeft
:function(e){e.left.skipWalk=!0},isUseStrictExpression:function(e){return e&&e.type===
t.ExpressionStatement.name&&e.expression&&e.expression.type===t.Literal.name&&e.
expression.value==="use strict"},maybeSkipNode:function(e,t){var n=!!this.currentState
.ignoring,r=this.currentState.currentHint,i=!n&&r&&r.type===t;return i?(this.startIgnore
(),e.postprocessor=this.endIgnore,!0):!1},coverStatement:function(e,n){var r,i,s
;this.maybeSkipNode(e,"next");if(this.isUseStrictExpression(e)){s=n.ancestor(2);
if(s&&(s.node.type===t.FunctionExpression.name||s.node.type===t.FunctionDeclaration
.name)&&n.parent().node.body[0]===e)return}e.type===t.FunctionDeclaration.name?r=
this.statementName(e.loc,1):(r=this.statementName(e.loc),i=f.statement(f.postIncrement
(f.subscript(f.dot(f.variable(this.currentState.trackerVar),f.variable("s")),f.stringLiteral
(r)))),this.splice(i,e,n))},splice:function(e,t,n){var r=n.isLabeled()?n.parent(
).node:t;r.prepend=r.prepend||[],d(r.prepend,e)},functionName:function(e,t,n){this
.currentState.func+=1;var r=this.currentState.func,i=!!this.currentState.ignoring
,s=e.id?e.id.name:"(anonymous_"+r+")",o=function(e){var t=n[e]||{};return{line:t
.line,column:t.column}};return this.coverState.fnMap[r]={name:s,line:t,loc:{start
:o("start"),end:o("end")},skip:i||undefined},this.coverState.f[r]=0,r},coverFunction
:function(e,t){var n,r=e.body,i=r.body,s;this.maybeSkipNode(e,"next"),n=this.functionName
(e,t.startLineForNode(e),{start:e.loc.start,end:{line:e.body.loc.start.line,column
:e.body.loc.start.column}}),i.length>0&&this.isUseStrictExpression(i[0])&&(s=i.shift
()),i.unshift(f.statement(f.postIncrement(f.subscript(f.dot(f.variable(this.currentState
.trackerVar),f.variable("f")),f.stringLiteral(n))))),s&&i.unshift(s)},branchName
:function(e,t,n){var r,i=[],s=[],o,u=!!this.currentState.ignoring;this.currentState
.branch+=1,r=this.currentState.branch;for(o=0;o<n.length;o+=1)n[o].skip=n[o].skip||
u||undefined,s.push(n[o]),i.push(0);return this.coverState.b[r]=i,this.coverState
.branchMap[r]={line:t,type:e,locations:s},r},branchIncrementExprAst:function(e,t
,n){var r=f.postIncrement(f.subscript(f.subscript(f.dot(f.variable(this.currentState
.trackerVar),f.variable("b")),f.stringLiteral(e)),f.numericLiteral(t)),n);return r
},locationsForNodes:function(e){var t=[],n;for(n=0;n<e.length;n+=1)t.push(e[n].loc
);return t},ifBranchInjector:function(e,t){var n=!!this.currentState.ignoring,r=
this.currentState.currentHint,i=!n&&r&&r.type==="if",s=!n&&r&&r.type==="else",o=
e.loc.start.line,u=e.loc.start.column,a=function(){return{line:o,column:u}},l=this
.branchName("if",t.startLineForNode(e),[{start:a(),end:a(),skip:i||undefined},{start
:a(),end:a(),skip:s||undefined}]),c=e.consequent.body,h=e.alternate.body,p;c.unshift
(f.statement(this.branchIncrementExprAst(l,0))),h.unshift(f.statement(this.branchIncrementExprAst
(l,1))),i&&(p=e.consequent,p.preprocessor=this.startIgnore,p.postprocessor=this.
endIgnore),s&&(p=e.alternate,p.preprocessor=this.startIgnore,p.postprocessor=this
.endIgnore)},branchLocationFor:function(e,t){return this.coverState.branchMap[e]
.locations[t]},switchBranchInjector:function(e,t){var n=e.cases,r,i;if(!(n&&n.length>0
))return;r=this.branchName("switch",t.startLineForNode(e),this.locationsForNodes
(n));for(i=0;i<n.length;i+=1)n[i].branchLocation=this.branchLocationFor(r,i),n[i
].consequent.unshift(f.statement(this.branchIncrementExprAst(r,i)))},switchCaseInjector
:function(e){var t=e.branchLocation;delete e.branchLocation,this.maybeSkipNode(e
,"next")&&(t.skip=!0)},conditionalBranchInjector:function(e,t){var n=this.branchName
("cond-expr",t.startLineForNode(e),this.locationsForNodes([e.consequent,e.alternate
])),r=this.branchIncrementExprAst(n,0),i=this.branchIncrementExprAst(n,1);e.consequent
.preprocessor=this.maybeAddSkip(this.branchLocationFor(n,0)),e.alternate.preprocessor=
this.maybeAddSkip(this.branchLocationFor(n,1)),e.consequent=f.sequence(r,e.consequent
),e.alternate=f.sequence(i,e.alternate)},maybeAddSkip:function(e){return function(
t){var n=!!this.currentState.ignoring,r=this.currentState.currentHint,i=!n&&r&&r
.type==="next";i&&(this.startIgnore(),t.postprocessor=this.endIgnore);if(i||n)e.
skip=!0}},logicalExpressionBranchInjector:function(e,n){var r=n.parent(),i=[],s,
o,u;this.maybeSkipNode(e,"next");if(r&&r.node.type===t.LogicalExpression.name)return;
this.findLeaves(e,i),s=this.branchName("binary-expr",n.startLineForNode(e),this.
locationsForNodes(i.map(function(e){return e.node})));for(u=0;u<i.length;u+=1)o=
i[u],o.parent[o.property]=f.sequence(this.branchIncrementExprAst(s,u),o.node),o.
node.preprocessor=this.maybeAddSkip(this.branchLocationFor(s,u))},findLeaves:function(
e,n,r,i){e.type===t.LogicalExpression.name?(this.findLeaves(e.left,n,e,"left"),this
.findLeaves(e.right,n,e,"right")):n.push({node:e,parent:r,property:i})},maybeAddType
:function(e){var n=e.properties,r,i;for(r=0;r<n.length;r+=1)i=n[r],i.type||(i.type=
t.Property.name)}},e?module.exports=g:window.Instrumenter=g})(typeof module!="undefined"&&typeof
module.exports!="undefined"&&typeof exports!="undefined")
}());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib istanbul.object-utils
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/object-utils.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/object-utils.js
(function () { var module, window; module = undefined; window = local;
(function(e){function t(e){var t=e.statementMap,n=e.s,r;e.l||(e.l=r={},Object.keys
(n).forEach(function(e){var i=t[e].start.line,s=n[e],o=r[i];s===0&&t[e].skip&&(s=1
);if(typeof o=="undefined"||o<s)r[i]=s}))}function n(e){Object.keys(e).forEach(function(
n){t(e[n])})}function r(e){Object.keys(e).forEach(function(t){delete e[t].l})}function i
(e,t){var n;return t>0?(n=1e5*e/t+5,Math.floor(n/10)/100):100}function s(e,t,n){
var r=e[t],s=n?e[n]:null,o={total:0,covered:0,skipped:0};return Object.keys(r).forEach
(function(e){var t=!!r[e],n=s&&s[e].skip;o.total+=1;if(t||n)o.covered+=1;!t&&n&&
(o.skipped+=1)}),o.pct=i(o.covered,o.total),o}function o(e){var t=e.b,n=e.branchMap
,r={total:0,covered:0,skipped:0};return Object.keys(t).forEach(function(e){var i=
t[e],s=n[e],o,u,a;for(a=0;a<i.length;a+=1){o=i[a]>0,u=s.locations&&s.locations[a
]&&s.locations[a].skip;if(o||u)r.covered+=1;!o&&u&&(r.skipped+=1)}r.total+=i.length
}),r.pct=i(r.covered,r.total),r}function u(){return{lines:{total:0,covered:0,skipped
:0,pct:"Unknown"},statements:{total:0,covered:0,skipped:0,pct:"Unknown"},functions
:{total:0,covered:0,skipped:0,pct:"Unknown"},branches:{total:0,covered:0,skipped
:0,pct:"Unknown"}}}function a(e){var n=u();return t(e),n.lines=s(e,"l"),n.functions=
s(e,"f","fnMap"),n.statements=s(e,"s","statementMap"),n.branches=o(e),n}function f
(e,t){var n=JSON.parse(JSON.stringify(e)),r;return delete n.l,Object.keys(t.s).forEach
(function(e){n.s[e]+=t.s[e]}),Object.keys(t.f).forEach(function(e){n.f[e]+=t.f[e
]}),Object.keys(t.b).forEach(function(e){var i=n.b[e],s=t.b[e];for(r=0;r<i.length
;r+=1)i[r]+=s[r]}),n}function l(){var e=u(),t=Array.prototype.slice.call(arguments
),n=["lines","statements","branches","functions"],r=function(t){t&&n.forEach(function(
n){e[n].total+=t[n].total,e[n].covered+=t[n].covered,e[n].skipped+=t[n].skipped}
)};return t.forEach(function(e){r(e)}),n.forEach(function(t){e[t].pct=i(e[t].covered
,e[t].total)}),e}function c(e){var t=[];return Object.keys(e).forEach(function(n
){t.push(a(e[n]))}),l.apply(null,t)}function h(e){var t={};return n(e),Object.keys
(e).forEach(function(n){var r=e[n],i=r.l,s=r.f,o=r.fnMap,u;u=t[n]={lines:{},calledLines
:0,coveredLines:0,functions:{},calledFunctions:0,coveredFunctions:0},Object.keys
(i).forEach(function(e){u.lines[e]=i[e],u.coveredLines+=1,i[e]>0&&(u.calledLines+=1
)}),Object.keys(s).forEach(function(e){var t=o[e].name+":"+o[e].line;u.functions
[t]=s[e],u.coveredFunctions+=1,s[e]>0&&(u.calledFunctions+=1)})}),t}var p={addDerivedInfo
:n,addDerivedInfoForFile:t,removeDerivedInfo:r,blankSummary:u,summarizeFileCoverage
:a,summarizeCoverage:c,mergeFileCoverage:f,mergeSummaryObjects:l,toYUICoverage:h
};e?module.exports=p:window.coverageUtils=p})(typeof module!="undefined"&&typeof
module.exports!="undefined"&&typeof exports!="undefined")
local['../object-utils'] = window.coverageUtils; }());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib istanbul.report.common.defaults
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/common/defaults.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/report/common/defaults.js
(function () { var module; module = {};
module.exports={watermarks:function(){return{statements:[50,80],lines:[50,80],functions
:[50,80],branches:[50,80]}},classFor:function(e,t,n){var r=n[e],i=t[e].pct;return i>=
r[1]?"high":i>=r[0]?"medium":"low"},colorize:function(e,t){if(process.stdout.isTTY
)switch(t){case"low":e="\x1B[91m"+e+"\x1B[0m";break;case"medium":e="\x1B[93m"+e+"\x1B[0m";break;
case"high":e="\x1B[92m"+e+"\x1B[0m"}return e}}
local['./common/defaults'] = module.exports; }());
/* jslint-ignore-end */



    // init lib istanbul.report.index
    (function () {
        // https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/index.js
        local['./index'] = {
            call: local.nop,
            mix: function (klass, prototype) {
                klass.prototype = prototype;
            }
        };
    }());



// init lib istanbul.report.templates.foot
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/templates/foot.txt
local['foot.txt'] = '\
</div>\n\
<div class="footer">\n\
    <div class="meta">Generated by <a href="https://github.com/kaizhu256/node-utility2" target="_blank">utility2</a> at {{datetime}}</div>\n\
</div>\n\
</body>\n\
</html>\n\
';



// init lib istanbul.report.templates.head
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/templates/head.txt
local['head.txt'] = '\
<!doctype html>\n\
<html lang="en">\n\
<head>\n\
    <title>Code coverage report for {{entity}}</title>\n\
    <meta charset="utf-8">\n\
    <style>\n\
        body, html {\n\
            margin:0; padding: 0;\n\
        }\n\
        body {\n\
            font-family: Arial, Helvetica;\n\
            font-size: 10pt;\n\
        }\n\
        div.header, div.footer {\n\
            background: #eee;\n\
            padding: 1em;\n\
        }\n\
        div.header {\n\
            height: 160px;\n\
            padding: 0 1em 0 1em;\n\
            z-index: 100;\n\
            position: fixed;\n\
            top: 0;\n\
            border-bottom: 1px solid #666;\n\
            width: 100%;\n\
        }\n\
        div.footer {\n\
            border-top: 1px solid #666;\n\
        }\n\
        div.body {\n\
            margin-top: 170px;\n\
        }\n\
        div.meta {\n\
            font-size: 90%;\n\
            text-align: center;\n\
        }\n\
        h1, h2, h3 {\n\
            font-weight: normal;\n\
        }\n\
        h1 {\n\
            font-size: 12pt;\n\
        }\n\
        h2 {\n\
            font-size: 10pt;\n\
        }\n\
        pre {\n\
            font-family: Menlo, Monaco, Consolas, Courier New, monospace;\n\
            margin: 0;\n\
            padding: 0;\n\
            font-size: 14px;\n\
            tab-size: 2;\n\
        }\n\
\n\
        div.path { font-size: 110%; }\n\
        div.path a:link, div.path a:visited { color: #000; }\n\
        table.coverage { border-collapse: collapse; margin:0; padding: 0 }\n\
\n\
        table.coverage td {\n\
            margin: 0;\n\
            padding: 0;\n\
            color: #111;\n\
            vertical-align: top;\n\
        }\n\
        table.coverage td.line-count {\n\
            width: 50px;\n\
            text-align: right;\n\
            padding-right: 5px;\n\
        }\n\
        table.coverage td.line-coverage {\n\
            color: #777 !important;\n\
            text-align: right;\n\
            border-left: 1px solid #666;\n\
            border-right: 1px solid #666;\n\
        }\n\
\n\
        table.coverage td.text {\n\
        }\n\
\n\
        table.coverage td span.cline-any {\n\
            display: inline-block;\n\
            padding: 0 5px;\n\
            width: 40px;\n\
        }\n\
        table.coverage td span.cline-neutral {\n\
            background: #eee;\n\
        }\n\
        table.coverage td span.cline-yes {\n\
            background: #b5d592;\n\
            color: #999;\n\
        }\n\
        table.coverage td span.cline-no {\n\
            background: #fc8c84;\n\
        }\n\
\n\
        .cstat-yes { color: #111; }\n\
        .cstat-no { background: #fc8c84; color: #111; }\n\
        .fstat-no { background: #ffc520; color: #111 !important; }\n\
        .cbranch-no { background:  yellow !important; color: #111; }\n\
\n\
        .cstat-skip { background: #ddd; color: #111; }\n\
        .fstat-skip { background: #ddd; color: #111 !important; }\n\
        .cbranch-skip { background: #ddd !important; color: #111; }\n\
\n\
        .missing-if-branch {\n\
            display: inline-block;\n\
            margin-right: 10px;\n\
            position: relative;\n\
            padding: 0 4px;\n\
            background: black;\n\
            color: yellow;\n\
        }\n\
\n\
        .skip-if-branch {\n\
            display: none;\n\
            margin-right: 10px;\n\
            position: relative;\n\
            padding: 0 4px;\n\
            background: #ccc;\n\
            color: white;\n\
        }\n\
\n\
        .missing-if-branch .typ, .skip-if-branch .typ {\n\
            color: inherit !important;\n\
        }\n\
\n\
        .entity, .metric { font-weight: bold; }\n\
        .metric { display: inline-block; border: 1px solid #333; padding: 0.3em; background: white; }\n\
        .metric small { font-size: 80%; font-weight: normal; color: #666; }\n\
\n\
        div.coverage-summary table { border-collapse: collapse; margin: 3em; font-size: 110%; }\n\
        div.coverage-summary td, div.coverage-summary table  th { margin: 0; padding: 0.25em 1em; border-top: 1px solid #666; border-bottom: 1px solid #666; }\n\
        div.coverage-summary th { text-align: left; border: 1px solid #666; background: #eee; font-weight: normal; }\n\
        div.coverage-summary th.file { border-right: none !important; }\n\
        div.coverage-summary th.pic { border-left: none !important; text-align: right; }\n\
        div.coverage-summary th.pct { border-right: none !important; }\n\
        div.coverage-summary th.abs { border-left: none !important; text-align: right; }\n\
        div.coverage-summary td.pct { text-align: right; border-left: 1px solid #666; }\n\
        div.coverage-summary td.abs { text-align: right; font-size: 90%; color: #444; border-right: 1px solid #666; }\n\
        div.coverage-summary td.file { text-align: right; border-left: 1px solid #666; white-space: nowrap;  }\n\
        div.coverage-summary td.pic { min-width: 120px !important;  }\n\
        div.coverage-summary a:link { color: #000; }\n\
        div.coverage-summary a:visited { color: #333; }\n\
        div.coverage-summary tfoot td { border-top: 1px solid #666; }\n\
\n\
        div.coverage-summary .yui3-datatable-sort-indicator, div.coverage-summary .dummy-sort-indicator {\n\
            height: 10px;\n\
            width: 7px;\n\
            display: inline-block;\n\
            margin-left: 0.5em;\n\
        }\n\
        div.coverage-summary .yui3-datatable-sort-indicator {\n\
            background: no-repeat scroll 0 0 transparent;\n\
        }\n\
        div.coverage-summary .yui3-datatable-sorted .yui3-datatable-sort-indicator {\n\
            background-position: 0 -20px;\n\
        }\n\
        div.coverage-summary .yui3-datatable-sorted-desc .yui3-datatable-sort-indicator {\n\
            background-position: 0 -10px;\n\
        }\n\
\n\
        .high { background: #b5d592 !important; }\n\
        .medium { background: #ffe87c !important; }\n\
        .low { background: #fc8c84 !important; }\n\
\n\
        span.cover-fill, span.cover-empty {\n\
            display:inline-block;\n\
            border:1px solid #444;\n\
            background: white;\n\
            height: 12px;\n\
        }\n\
        span.cover-fill {\n\
            background: #ccc;\n\
            border-right: 1px solid #444;\n\
        }\n\
        span.cover-empty {\n\
            background: white;\n\
            border-left: none;\n\
        }\n\
        span.cover-full {\n\
            border-right: none !important;\n\
        }\n\
        pre.prettyprint {\n\
            border: none !important;\n\
            padding: 0 !important;\n\
            margin: 0 !important;\n\
        }\n\
        .com { color: #999 !important; }\n\
        .ignore-none { color: #999; font-weight: normal; }\n\
\n\
    </style>\n\
</head>\n\
<body>\n\
<div class="header {{reportClass}}">\n\
    <h1 style="font-weight: bold;">\n\
        <a href="{{env.npm_package_homepage}}">{{env.npm_package_name}} (v{{env.npm_package_version}})</a>\n\
    </h1>\n\
    <h1>Code coverage report for <span class="entity">{{entity}}</span></h1>\n\
    <h2>\n\
        {{#with metrics.statements}}\n\
        Statements: <span class="metric">{{pct}}% <small>({{covered}} / {{total}})</small></span> &nbsp;&nbsp;&nbsp;&nbsp;\n\
        {{/with}}\n\
        {{#with metrics.branches}}\n\
        Branches: <span class="metric">{{pct}}% <small>({{covered}} / {{total}})</small></span> &nbsp;&nbsp;&nbsp;&nbsp;\n\
        {{/with}}\n\
        {{#with metrics.functions}}\n\
        Functions: <span class="metric">{{pct}}% <small>({{covered}} / {{total}})</small></span> &nbsp;&nbsp;&nbsp;&nbsp;\n\
        {{/with}}\n\
        {{#with metrics.lines}}\n\
        Lines: <span class="metric">{{pct}}% <small>({{covered}} / {{total}})</small></span> &nbsp;&nbsp;&nbsp;&nbsp;\n\
        {{/with}}\n\
        Ignored: <span class="metric">{{#show_ignores metrics}}{{/show_ignores}}</span> &nbsp;&nbsp;&nbsp;&nbsp;\n\
    </h2>\n\
    {{{pathHtml}}}\n\
</div>\n\
<div class="body">\n\
';
/* jslint-ignore-end */



    /* istanbul ignore next */
    // init lib istanbul.util.file-writer
    (function () {
        // https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/util/file-writer.js
        local.writer = {
            write: function (data) {
                local.writerData += data;
            },
            writeFile: function (file, onError) {
                local.coverageReportHtml += local.writerData + '\n\n';
                if (local.writerFile) {
                    local.fsWriteFileWithMkdirpSync2(local.writerFile, local.writerData);
                }
                local.writerData = '';
                local.writerFile = file;
                onError(local.writer);
            }
        };
    }());



    /* istanbul ignore next */
    // init lib istanbul.util.tree-summarizer
    (function () {
        var module;
        module = {};
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/util/tree-summarizer.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/util/tree-summarizer.js
function commonArrayPrefix(e,t){var n=e.length<t.length?e.length:t.length,r,i=[]
;for(r=0;r<n;r+=1){if(e[r]!==t[r])break;i.push(e[r])}return i}function findCommonArrayPrefix
(e){if(e.length===0)return[];var t=e.map(function(e){return e.split(SEP)}),n=t.pop
();return t.length===0?n.slice(0,n.length-1):t.reduce(commonArrayPrefix,n)}function Node
(e,t,n){this.name=e,this.fullName=e,this.kind=t,this.metrics=n||null,this.parent=
null,this.children=[]}function TreeSummary(e,t){this.prefix=t,this.convertToTree
(e,t)}function TreeSummarizer(){this.summaryMap={}}var path=require("path"),SEP=
path.sep||"/",utils=require("../object-utils");Node.prototype={displayShortName:
function(){return this.relativeName},fullPath:function(){return this.fullName},addChild
:function(e){this.children.push(e),e.parent=this},toJSON:function(){return{name:
this.name,relativeName:this.relativeName,fullName:this.fullName,kind:this.kind,metrics
:this.metrics,parent:this.parent===null?null:this.parent.name,children:this.children
.map(function(e){return e.toJSON()})}}},TreeSummary.prototype={getNode:function(
e){return this.map[e]},convertToTree:function(e,t){var n=[],r=t.join(SEP)+SEP,i=new
Node(r,"dir"),s,o,u={},a=!1;u[r]=i,Object.keys(e).forEach(function(t){var r=e[t]
,s,o,f;s=new Node(t,"file",r),u[t]=s,n.push(s),o=path.dirname(t)+SEP,o===SEP+SEP&&
(o=SEP+"__root__"+SEP),f=u[o],f||(f=new Node(o,"dir"),i.addChild(f),u[o]=f),f.addChild
(s),f===i&&(a=!0)}),a&&t.length>0&&(t.pop(),s=i,o=s.children,s.children=[],i=new
Node(t.join(SEP)+SEP,"dir"),i.addChild(s),o.forEach(function(e){e.kind==="dir"?i
.addChild(e):s.addChild(e)})),this.fixupNodes(i,t.join(SEP)+SEP),this.calculateMetrics
(i),this.root=i,this.map={},this.indexAndSortTree(i,this.map)},fixupNodes:function(
e,t,n){var r=this;e.name.indexOf(t)===0&&(e.name=e.name.substring(t.length)),e.name
.charAt(0)===SEP&&(e.name=e.name.substring(1)),n?n.name!=="__root__/"?e.relativeName=
e.name.substring(n.name.length):e.relativeName=e.name:e.relativeName=e.name.substring
(t.length),e.children.forEach(function(n){r.fixupNodes(n,t,e)})},calculateMetrics
:function(e){var t=this,n;if(e.kind!=="dir")return;e.children.forEach(function(e
){t.calculateMetrics(e)}),e.metrics=utils.mergeSummaryObjects.apply(null,e.children
.map(function(e){return e.metrics})),n=e.children.filter(function(e){return e.kind!=="dir"
}),n.length>0?e.packageMetrics=utils.mergeSummaryObjects.apply(null,n.map(function(
e){return e.metrics})):e.packageMetrics=null},indexAndSortTree:function(e,t){var n=
this;t[e.name]=e,e.children.sort(function(e,t){return e=e.relativeName,t=t.relativeName
,e<t?-1:e>t?1:0}),e.children.forEach(function(e){n.indexAndSortTree(e,t)})},toJSON
:function(){return{prefix:this.prefix,root:this.root.toJSON()}}},TreeSummarizer.
prototype={addFileCoverageSummary:function(e,t){this.summaryMap[e]=t},getTreeSummary
:function(){var e=findCommonArrayPrefix(Object.keys(this.summaryMap));return new
TreeSummary(this.summaryMap,e)}},module.exports=TreeSummarizer
/* jslint-ignore-end */
        local['../util/tree-summarizer'] = module.exports;
        module.exports.prototype._getTreeSummary = module.exports.prototype.getTreeSummary;
        module.exports.prototype.getTreeSummary = function () {
            local.coverageReportSummary = this._getTreeSummary();
            return local.coverageReportSummary;
        };
    }());



/* istanbul ignore next */
// init lib istanbul.report.html
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/html.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/report/html.js
(function () { var module; module = {};
function customEscape(e){return e=e.toString(),e.replace(RE_AMP,"&amp;").replace
(RE_LT,"&lt;").replace(RE_GT,"&gt;").replace(RE_lt,"<").replace(RE_gt,">")}function title
(e){return' title="'+e+'" '}function annotateLines(e,t){var n=e.l;if(!n)return;Object
.keys(n).forEach(function(e){var r=n[e];t[e].covered=r>0?"yes":"no"}),t.forEach(
function(e){e.covered===null&&(e.covered="neutral")})}function annotateStatements
(e,t){var n=e.s,r=e.statementMap;Object.keys(n).forEach(function(e){var i=n[e],s=
r[e],o=i>0?"yes":"no",u=s.start.column,a=s.end.column+1,f=s.start.line,l=s.end.line
,c=lt+'span class="'+(s.skip?"cstat-skip":"cstat-no")+'"'+title("statement not covered"
)+gt,h=lt+"/span"+gt,p;o==="no"&&(l!==f&&(l=f,a=t[f].text.originalLength()),p=t[
f].text,p.wrap(u,c,f===l?a:p.originalLength(),h))})}function annotateFunctions(e
,t){var n=e.f,r=e.fnMap;if(!n)return;Object.keys(n).forEach(function(e){var i=n[
e],s=r[e],o=i>0?"yes":"no",u=s.loc.start.column,a=s.loc.end.column+1,f=s.loc.start
.line,l=s.loc.end.line,c=lt+'span class="'+(s.skip?"fstat-skip":"fstat-no")+'"'+
title("function not covered")+gt,h=lt+"/span"+gt,p;o==="no"&&(l!==f&&(l=f,a=t[f]
.text.originalLength()),p=t[f].text,p.wrap(u,c,f===l?a:p.originalLength(),h))})}
function annotateBranches(e,t){var n=e.b,r=e.branchMap;if(!n)return;Object.keys(
n).forEach(function(e){var i=n[e],s=i.reduce(function(e,t){return e+t},0),o=r[e]
.locations,u,a,f,l,c,h,p,d,v,m,g;if(s>0)for(u=0;u<i.length;u+=1)a=i[u],f=o[u],l=
a>0?"yes":"no",c=f.start.column,h=f.end.column+1,p=f.start.line,d=f.end.line,v=lt+'span class="branch-'+
u+" "+(f.skip?"cbranch-skip":"cbranch-no")+'"'+title("branch not covered")+gt,m=
lt+"/span"+gt,a===0&&(d!==p&&(d=p,h=t[p].text.originalLength()),g=t[p].text,r[e]
.type==="if"?g.insertAt(c,lt+'span class="'+(f.skip?"skip-if-branch":"missing-if-branch"
)+'"'+title((u===0?"if":"else")+" path not taken")+gt+(u===0?"I":"E")+lt+"/span"+
gt,!0,!1):g.wrap(c,v,p===d?h:g.originalLength(),m))})}function getReportClass(e,
t){var n=e.pct,r=1;return n*r===n?n>=t[1]?"high":n>=t[0]?"medium":"low":""}function HtmlReport
(e){Report.call(this),this.opts=e||{},this.opts.dir=this.opts.dir||path.resolve(
process.cwd(),"html-report"),this.opts.sourceStore=this.opts.sourceStore||Store.
create("fslookup"),this.opts.linkMapper=this.opts.linkMapper||this.standardLinkMapper
(),this.opts.writer=this.opts.writer||null,this.opts.templateData={datetime:Date
()},this.opts.watermarks=this.opts.watermarks||defaults.watermarks()}var handlebars=
require("handlebars"),defaults=require("./common/defaults"),path=require("path")
,SEP=path.sep||"/",fs=require("fs"),util=require("util"),FileWriter=require("../util/file-writer"
),Report=require("./index"),Store=require("../store"),InsertionText=require("../util/insertion-text"
),TreeSummarizer=require("../util/tree-summarizer"),utils=require("../object-utils"
),templateFor=function(e){return handlebars.compile(fs.readFileSync(path.resolve
(__dirname,"templates",e+".txt"),"utf8"))},headerTemplate=templateFor("head"),footerTemplate=
templateFor("foot"),pathTemplate=handlebars.compile('<div class="path">{{{html}}}</div>'
),detailTemplate=handlebars.compile(["<tr>",'<td class="line-count">{{#show_lines}}{{maxLines}}{{/show_lines}}</td>'
,'<td class="line-coverage">{{#show_line_execution_counts fileCoverage}}{{maxLines}}{{/show_line_execution_counts}}</td>'
,'<td class="text"><pre class="prettyprint lang-js">{{#show_code structured}}{{/show_code}}</pre></td>'
,"</tr>\n"].join("")),summaryTableHeader=['<div class="coverage-summary">',"<table>"
,"<thead>","<tr>",'   <th data-col="file" data-fmt="html" data-html="true" class="file">File</th>'
,'   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>'
,'   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>'
,'   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>'
,'   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>'
,'   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>'
,'   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>'
,'   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>'
,'   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>'
,'   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>'
,"</tr>","</thead>","<tbody>"].join("\n"),summaryLineTemplate=handlebars.compile
(["<tr>",'<td class="file {{reportClasses.statements}}" data-value="{{file}}"><a href="{{output}}">{{file}}</a></td>'
,'<td data-value="{{metrics.statements.pct}}" class="pic {{reportClasses.statements}}">{{#show_picture}}{{metrics.statements.pct}}{{/show_picture}}</td>'
,'<td data-value="{{metrics.statements.pct}}" class="pct {{reportClasses.statements}}">{{metrics.statements.pct}}%</td>'
,'<td data-value="{{metrics.statements.total}}" class="abs {{reportClasses.statements}}">({{metrics.statements.covered}}&nbsp;/&nbsp;{{metrics.statements.total}})</td>'
,'<td data-value="{{metrics.branches.pct}}" class="pct {{reportClasses.branches}}">{{metrics.branches.pct}}%</td>'
,'<td data-value="{{metrics.branches.total}}" class="abs {{reportClasses.branches}}">({{metrics.branches.covered}}&nbsp;/&nbsp;{{metrics.branches.total}})</td>'
,'<td data-value="{{metrics.functions.pct}}" class="pct {{reportClasses.functions}}">{{metrics.functions.pct}}%</td>'
,'<td data-value="{{metrics.functions.total}}" class="abs {{reportClasses.functions}}">({{metrics.functions.covered}}&nbsp;/&nbsp;{{metrics.functions.total}})</td>'
,'<td data-value="{{metrics.lines.pct}}" class="pct {{reportClasses.lines}}">{{metrics.lines.pct}}%</td>'
,'<td data-value="{{metrics.lines.total}}" class="abs {{reportClasses.lines}}">({{metrics.lines.covered}}&nbsp;/&nbsp;{{metrics.lines.total}})</td>'
,"</tr>\n"].join("\n	")),summaryTableFooter=["</tbody>","</table>","</div>"].join
("\n"),lt="",gt="",RE_LT=/</g,RE_GT=/>/g,RE_AMP=/&/g,RE_lt=/\u0001/g,RE_gt=/\u0002/g
;handlebars.registerHelper("show_picture",function(e){var t=Number(e.fn(this)),n
,r="";return isFinite(t)?(t===100&&(r=" cover-full"),t=Math.floor(t),n=100-t,'<span class="cover-fill'+
r+'" style="width: '+t+'px;"></span>'+'<span class="cover-empty" style="width:'+
n+'px;"></span>'):""}),handlebars.registerHelper("show_ignores",function(e){var t=
e.statements.skipped,n=e.functions.skipped,r=e.branches.skipped,i;return t===0&&
n===0&&r===0?'<span class="ignore-none">none</span>':(i=[],t>0&&i.push(t===1?"1 statement"
:t+" statements"),n>0&&i.push(n===1?"1 function":n+" functions"),r>0&&i.push(r===1?"1 branch"
:r+" branches"),i.join(", "))}),handlebars.registerHelper("show_lines",function(
e){var t=Number(e.fn(this)),n,r=[];for(n=0;n<t;n+=1)r[n]=n+1;return r.join("\n")
}),handlebars.registerHelper("show_line_execution_counts",function(e,t){var n=e.
l,r=Number(t.fn(this)),i,s,o=[],u,a="";for(i=0;i<r;i+=1)s=i+1,a="&nbsp;",u="neutral"
,n.hasOwnProperty(s)&&(n[s]>0?(u="yes",a=n[s]):u="no"),o.push('<span class="cline-any cline-'+
u+'">'+a+"</span>");return o.join("\n")}),handlebars.registerHelper("show_code",
function(e){var t=[];return e.forEach(function(e){t.push(customEscape(e.text)||"&nbsp;"
)}),t.join("\n")}),HtmlReport.TYPE="html",util.inherits(HtmlReport,Report),Report
.mix(HtmlReport,{getPathHtml:function(e,t){var n=e.parent,r=[],i=[],s;while(n)r.
push(n),n=n.parent;for(s=0;s<r.length;s+=1)i.push('<a href="'+t.ancestor(e,s+1)+'">'+
(r[s].relativeName||"All files")+"</a>");return i.reverse(),i.length>0?i.join(" &#187; "
)+" &#187; "+e.displayShortName():""},fillTemplate:function(e,t){var n=this.opts
,r=n.linkMapper;t.entity=e.name||"All files",t.metrics=e.metrics,t.reportClass=getReportClass
(e.metrics.statements,n.watermarks.statements),t.pathHtml=pathTemplate({html:this
.getPathHtml(e,r)}),t.prettify={js:r.asset(e,"prettify.js"),css:r.asset(e,"prettify.css"
)}},writeDetailPage:function(e,t,n){var r=this.opts,i=r.sourceStore,s=r.templateData
,o=n.code&&Array.isArray(n.code)?n.code.join("\n")+"\n":i.get(n.path),u=o.split(/(?:\r?\n)|\r/
),a=0,f=u.map(function(e){return a+=1,{line:a,covered:null,text:new InsertionText
(e,!0)}}),l;f.unshift({line:0,covered:null,text:new InsertionText("")}),this.fillTemplate
(t,s),e.write(headerTemplate(s)),e.write('<pre><table class="coverage">\n'),annotateLines
(n,f),annotateBranches(n,f),annotateFunctions(n,f),annotateStatements(n,f),f.shift
(),l={structured:f,maxLines:f.length,fileCoverage:n},e.write(detailTemplate(l)),
e.write("</table></pre>\n"),e.write(footerTemplate(s))},writeIndexPage:function(
e,t){var n=this.opts.linkMapper,r=this.opts.templateData,i=Array.prototype.slice
.apply(t.children),s=this.opts.watermarks;i.sort(function(e,t){return e.name<t.name?-1
:1}),this.fillTemplate(t,r),e.write(headerTemplate(r)),e.write(summaryTableHeader
),i.forEach(function(t){var r=t.metrics,i={statements:getReportClass(r.statements
,s.statements),lines:getReportClass(r.lines,s.lines),functions:getReportClass(r.
functions,s.functions),branches:getReportClass(r.branches,s.branches)},o={metrics
:r,reportClasses:i,file:t.displayShortName(),output:n.fromParent(t)};e.write(summaryLineTemplate
(o)+"\n")}),e.write(summaryTableFooter),e.write(footerTemplate(r))},writeFiles:function(
e,t,n,r){var i=this,s=path.resolve(n,"index.html"),o;this.opts.verbose&&console.
error("Writing "+s),e.writeFile(s,function(e){i.writeIndexPage(e,t)}),t.children
.forEach(function(t){t.kind==="dir"?i.writeFiles(e,t,path.resolve(n,t.relativeName
),r):(o=path.resolve(n,t.relativeName+".html"),i.opts.verbose&&console.error("Writing "+
o),e.writeFile(o,function(e){i.writeDetailPage(e,t,r.fileCoverageFor(t.fullPath(
)))}))})},standardLinkMapper:function(){return{fromParent:function(e){var t=0,n=
e.relativeName,r;if(SEP!=="/"){n="";for(t=0;t<e.relativeName.length;t+=1)r=e.relativeName
.charAt(t),r===SEP?n+="/":n+=r}return e.kind==="dir"?n+"index.html":n+".html"},ancestorHref
:function(e,t){var n="",r,i,s,o;for(s=0;s<t;s+=1){r=e.relativeName.split(SEP),i=
r.length-1;for(o=0;o<i;o+=1)n+="../";e=e.parent}return n},ancestor:function(e,t)
{return this.ancestorHref(e,t)+"index.html"},asset:function(e,t){var n=0,r=e.parent
;while(r)n+=1,r=r.parent;return this.ancestorHref(e,n)+t}}},writeReport:function(
e,t){var n=this.opts,r=n.dir,i=new TreeSummarizer,s=n.writer||new FileWriter(t),
o;e.files().forEach(function(t){i.addFileCoverageSummary(t,utils.summarizeFileCoverage
(e.fileCoverageFor(t)))}),o=i.getTreeSummary(),fs.readdirSync(path.resolve(__dirname
,"..","vendor")).forEach(function(e){var t=path.resolve(__dirname,"..","vendor",
e),i=path.resolve(r,e),o=fs.statSync(t);o.isFile()&&(n.verbose&&console.log("Write asset: "+
i),s.copyFile(t,i))}),this.writeFiles(s,o.root,r,e)}}),module.exports=HtmlReport
local.HtmlReport = module.exports; }());
/* jslint-ignore-end */



/* istanbul ignore next */
// init lib istanbul.report.text
/* jslint-ignore-begin */
// https://github.com/gotwarlost/istanbul/blob/v0.2.16/lib/report/text.js
// utility2-uglifyjs https://raw.githubusercontent.com/gotwarlost/istanbul/v0.2.16/lib/report/text.js
(function () { var module; module = {};
function TextReport(e){Report.call(this),e=e||{},this.dir=e.dir||process.cwd(),this
.file=e.file,this.summary=e.summary,this.maxCols=e.maxCols||0,this.watermarks=e.
watermarks||defaults.watermarks()}function padding(e,t){var n="",r;t=t||" ";for(
r=0;r<e;r+=1)n+=t;return n}function fill(e,t,n,r,i){r=r||0,e=String(e);var s=r*TAB_SIZE
,o=t-s,u=padding(s),a="",f,l=e.length;return o>0&&(o>=l?(f=padding(o-l),a=n?f+e:
e+f):(a=e.substring(l-o),a="... "+a.substring(4))),a=defaults.colorize(a,i),u+a}
function formatName(e,t,n,r){return fill(e,t,!1,n,r)}function formatPct(e,t){return fill
(e,PCT_COLS,!0,0,t)}function nodeName(e){return e.displayShortName()||"All files"
}function tableHeader(e){var t=[];return t.push(formatName("File",e,0)),t.push(formatPct
("% Stmts")),t.push(formatPct("% Branches")),t.push(formatPct("% Funcs")),t.push
(formatPct("% Lines")),t.join(" |")+" |"}function tableRow(e,t,n,r){var i=nodeName
(e),s=e.metrics.statements.pct,o=e.metrics.branches.pct,u=e.metrics.functions.pct
,a=e.metrics.lines.pct,f=[];return f.push(formatName(i,t,n,defaults.classFor("statements"
,e.metrics,r))),f.push(formatPct(s,defaults.classFor("statements",e.metrics,r)))
,f.push(formatPct(o,defaults.classFor("branches",e.metrics,r))),f.push(formatPct
(u,defaults.classFor("functions",e.metrics,r))),f.push(formatPct(a,defaults.classFor
("lines",e.metrics,r))),f.join(DELIM)+DELIM}function findNameWidth(e,t,n){n=n||0
,t=t||0;var r=TAB_SIZE*t+nodeName(e).length;return r>n&&(n=r),e.children.forEach
(function(e){n=findNameWidth(e,t+1,n)}),n}function makeLine(e){var t=padding(e,"-"
),n=padding(PCT_COLS,"-"),r=[];return r.push(t),r.push(n),r.push(n),r.push(n),r.
push(n),r.join(COL_DELIM)+COL_DELIM}function walk(e,t,n,r,i){var s;r===0?(s=makeLine
(t),n.push(s),n.push(tableHeader(t)),n.push(s)):n.push(tableRow(e,t,r,i)),e.children
.forEach(function(e){walk(e,t,n,r+1,i)}),r===0&&(n.push(s),n.push(tableRow(e,t,r
,i)),n.push(s))}var path=require("path"),mkdirp=require("mkdirp"),fs=require("fs"
),defaults=require("./common/defaults"),Report=require("./index"),TreeSummarizer=
require("../util/tree-summarizer"),utils=require("../object-utils"),PCT_COLS=10,
TAB_SIZE=3,DELIM=" |",COL_DELIM="-|";TextReport.TYPE="text",Report.mix(TextReport
,{writeReport:function(e){var t=new TreeSummarizer,n,r,i,s=4*(PCT_COLS+2),o,u=[]
,a;e.files().forEach(function(n){t.addFileCoverageSummary(n,utils.summarizeFileCoverage
(e.fileCoverageFor(n)))}),n=t.getTreeSummary(),r=n.root,i=findNameWidth(r),this.
maxCols>0&&(o=this.maxCols-s-2,i>o&&(i=o)),walk(r,i,u,0,this.watermarks),a=u.join
("\n")+"\n",this.file?(mkdirp.sync(this.dir),fs.writeFileSync(path.join(this.dir
,this.file),a,"utf8")):console.log(a)}}),module.exports=TextReport
local.TextReport = module.exports; }());
/* jslint-ignore-end */



/* jslint-ignore-begin */
// https://img.shields.io/badge/coverage-100.0%-00dd00.svg?style=flat
local.templateCoverageBadgeSvg =
'<svg xmlns="http://www.w3.org/2000/svg" width="117" height="20"><linearGradient id="a" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><rect rx="0" width="117" height="20" fill="#555"/><rect rx="0" x="63" width="54" height="20" fill="#0d0"/><path fill="#0d0" d="M63 0h4v20h-4z"/><rect rx="0" width="117" height="20" fill="url(#a)"/><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11"><text x="32.5" y="15" fill="#010101" fill-opacity=".3">coverage</text><text x="32.5" y="14">coverage</text><text x="89" y="15" fill="#010101" fill-opacity=".3">100.0%</text><text x="89" y="14">100.0%</text></g></svg>';
/* jslint-ignore-end */
    switch (local.modeJs) {



    // run node js-env code - post-init
    case 'node':
        /* istanbul ignore next */
        // run the cli
        local.cliRunIstanbul = function (options) {
        /*
         * this function will run the cli
         */
            var tmp;
            if ((module !== local.require.main || local.global.utility2_rollup) &&
                    !(options && options.runMain)) {
                return;
            }
            switch (process.argv[2]) {
            // transparently adds coverage information to a node command
            case 'cover':
                try {
                    tmp = JSON.parse(local._fs.readFileSync('package.json', 'utf8'));
                    process.env.npm_package_nameAlias = process.env.npm_package_nameAlias ||
                        tmp.nameAlias ||
                        tmp.name.replace((/-/g), '_');
                } catch (ignore) {
                }
                process.env.npm_config_mode_coverage = process.env.npm_config_mode_coverage ||
                    process.env.npm_package_nameAlias ||
                    'all';
                // add coverage hook to require
                local._moduleExtensionsJs = local.module._extensions['.js'];
                local.module._extensions['.js'] = function (module, file) {
                    if (typeof file === 'string' &&
                            file.indexOf(process.cwd()) === 0 &&
                            file.indexOf(process.cwd() + '/node_modules/') !== 0) {
                        module._compile(local.instrumentInPackage(
                            local._fs.readFileSync(file, 'utf8'),
                            file
                        ), file);
                        return;
                    }
                    local._moduleExtensionsJs(module, file);
                };
                // init process.argv
                process.argv.splice(1, 2);
                process.argv[1] = local.path.resolve(process.cwd(), process.argv[1]);
                console.log('\ncovering $ ' + process.argv.join(' '));
                // create coverage on exit
                process.on('exit', function () {
                    local.coverageReportCreate({ coverage: local.global.__coverage__ });
                });
                // re-run cli
                local.module.runMain();
                break;
            // instrument a file and print result to stdout
            case 'instrument':
                process.argv[3] = local.path.resolve(process.cwd(), process.argv[3]);
                process.stdout.write(local.instrumentSync(
                    local._fs.readFileSync(process.argv[3], 'utf8'),
                    process.argv[3]
                ));
                break;
            // cover a node command only when npm_config_mode_coverage is set
            case 'test':
                if (process.env.npm_config_mode_coverage) {
                    process.argv[2] = 'cover';
                    // re-run cli
                    local.cliRunIstanbul(options);
                    return;
                }
                // init process.argv
                process.argv.splice(1, 2);
                process.argv[1] = local.path.resolve(process.cwd(), process.argv[1]);
                // re-run cli
                local.module.runMain();
                break;
            }
        };
        local.cliRunIstanbul();
        break;
    }
}(
    // run shared js-env code - pre-init
    (function () {
        'use strict';
        var local;
        // init local
        local = {};
        // init modeJs
        local.modeJs = (function () {
            try {
                return typeof navigator.userAgent === 'string' &&
                    typeof document.querySelector('body') === 'object' &&
                    typeof XMLHttpRequest.prototype.open === 'function' &&
                    'browser';
            } catch (errorCaughtBrowser) {
                return module.exports &&
                    typeof process.versions.node === 'string' &&
                    typeof require('http').createServer === 'function' &&
                    'node';
            }
        }());
        // init global
        local.global = local.modeJs === 'browser'
            ? window
            : global;
        // init utility2_rollup
        local = local.global.utility2_rollup || local;
        // init lib
        local.local = local.istanbul = local;
        // init exports
        if (local.modeJs === 'browser') {
            local.global.utility2_istanbul = local;
        } else {
            module.exports = local;
            module.exports.__dirname = __dirname;
        }
        local.fsWriteFileWithMkdirpSync = function (file, data) {
        /*
         * this function will synchronously 'mkdir -p' and write the data to file
         */
            // try to write to file
            try {
                require('fs').writeFileSync(file, data);
            } catch (errorCaught) {
                // mkdir -p
                require('child_process').spawnSync(
                    'mkdir',
                    ['-p', require('path').dirname(file)],
                    { stdio: ['ignore', 1, 2] }
                );
                // re-write to file
                require('fs').writeFileSync(file, data);
            }
        };
        local.nop = function () {
        /*
         * this function will do nothing
         */
            return;
        };
        switch (local.modeJs) {
        case 'browser':
            local.fsWriteFileWithMkdirpSync2 = local.nop;
            break;
        case 'node':
            local.fsWriteFileWithMkdirpSync2 = local.fsWriteFileWithMkdirpSync;
            local.__dirname = __dirname;
            local.process = process;
            local.require = require;
            break;
        }
        return local;
    }())
));
