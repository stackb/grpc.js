/**
 * @fileoverview grpc Transport interface.
 *
 */
goog.module('grpc.Transport');

const ByteSource = goog.require('jspb.ByteSource');
const Endpoint = goog.require('grpc.Endpoint');
const Observer = goog.require('grpc.Observer');


/**
 * Client-side abstraction of a communications bridge that can marshal
 * requests and responses between two StreamObservers.
 *
 * @interface
 */
const Transport = function () { };

/**
 * Call a remote procedure.
 *
 * @param {string} name The name of the procedure to call
 * @param {!function(INPUT):!ByteSource} encoder A serializer function that can encode input messages.
 * @param {!function(!ByteSource):OUTPUT} decoder A serializer function that can decode output messages.
 * @param {!Observer<OUTPUT>} observer An observer used to recieve responses.
 * @param {?Endpoint=} opt_endpoint Optional additional endpoint configuration.
 * @return {!Observer<INPUT>} The input observer that the caller should supply
 * with requests.
 * @template INPUT
 * @template OUTPUT
 */
Transport.prototype.call = function (name, encoder, decoder, observer, opt_endpoint) { };

/**
 * @public
 * @enum {string}
 */
Transport.Type = {
    XHR: 'xhr',
    FETCH: 'fetch',
    WEBSOCKET: 'websocket',
};

exports = Transport;