var url = require('url');
var express = require('express');
var app = express();
var path = require('path');
var htdocs = path.join(__dirname, '../public');
var dataEvent = require('./data-event');
var fs = require('fs');
var axios = require('axios');

/**
 * whistle会通过请求的头部，把配置的值及是否为https或wss请求传递给插件
 */
var RULE_VALUE_HEADER, SSL_FLAG_HEADER;

//获取 pattern helloworld://ruleValue的ruleValue
function getRuleValue(req) {
	return decodeURIComponent(req.headers[RULE_VALUE_HEADER] || '');
}

//判断是否是https请求
function isHttps(req) {
	return !!req.headers[SSL_FLAG_HEADER];
}

function getFullUrl(req, ws) {
	var options = url.parse(req.url);
	var proto = ws ? 'ws' : 'http';
	return proto + (isHttps(req) ? 's' : '') + '://' + req.headers.host + options.path;
}

function initHttpServer(app) {
	app.use(async (req, res, next) => {
        var method = req.method;
        var headers = req.headers;
        var regex = /^x-*/i;
        for (i in headers) {
            if (regex.test(i)) {
                delete(headers[i]);
            }
        }
        var options = {
            method: method,
            headers: headers,
            url: 'http://' + req.host + req.url,
        };
        if (options.method == "GET") {
            try {
                const response = await axios.request(options);
                // res.type('json').end(JSON.stringify(response.data));
                const resp = await axios.post('http://127.0.0.1:3456/', {
                    url: options.url,
                    result: response.data
                });
                if (/getplayinfolist/.test(options.url)) {
                    res.type('json').end(JSON.stringify({code: 1, msg: "not ok"}));
                } else {
                    res.type('json').end(JSON.stringify(response.data));
                }
            } catch (error) {
                res.type('json').end(JSON.stringify({code: 0, msg: 'noop'}));
            }
        }

        // var pathReg = /\/vrworldapi\/api\/v1\/content\/getprogramdetail*/;
        // if (pathReg.test(options.path)) {

        // }
	});
}


module.exports = function(server, options) {
	RULE_VALUE_HEADER = options.RULE_VALUE_HEADER;
	SSL_FLAG_HEADER = options.SSL_FLAG_HEADER;
	server.on('request', app);
	initHttpServer(app);
};
