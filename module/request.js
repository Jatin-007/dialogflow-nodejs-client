/*!
 * apiai
 * Copyright(c) 2015 http://api.ai/
 * Apache 2.0 Licensed
 */

'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var https = require('https');
var http = require('http');

exports.Request = module.exports.Request = Request;

util.inherits(Request, EventEmitter);

function Request (application, options) {
    var self = this;

    self.clientAccessToken = application.clientAccessToken;

    self.hostname = application.hostname;

    self.endpoint = options.endpoint;
    self.requestSource = application.requestSource;

    var _http = application.secure ? https : http;

    var requestOptions = self._requestOptions();

    requestOptions.agent = application._agent;

    var request = _http.request(requestOptions, function(response) {
        var body = '';

        response.on('data', function(chunk) {
            body += chunk;
        });

        response.on('end', function() {
            if (response.statusCode >= 200 && response.statusCode <= 299) {
                var json_body = null;
                try {
                    json_body = JSON.parse(body);
                } catch (error) {
                    self.emit('error', error);
                }

                if (json_body != null) {
                    self.emit('response', json_body);
                }
            } else {                
                self.emit('error', JSON.parse(body));
            }
        });
    });

    request.on('error', function(error) {
        self.emit('error', error);
    });

    self.request = request;
}

Request.prototype._headers = function() {
    var self = this;

    return {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + self.clientAccessToken,
        'api-request-source': self.requestSource
    };
};

Request.prototype._requestOptions = function() {
    var self = this;

    return {
        hostname: self.hostname,
        headers: self._headers()
    };
};

Request.prototype.write = function(chunk) {
    this.request.write(chunk);
};

Request.prototype.end = function() {
    this.request.end();
};
