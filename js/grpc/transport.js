/**
 * @fileoverview grpc Transport interface.
 *
 */
goog.provide('grpc.Transport');

goog.require('jspb.ByteSource');


/**
 * Client-side abstraction of a communications bridge that can marshal
 * requests and responses between two StreamObservers.
 *
 * @interface
 */
grpc.Transport = function() {
};


/**
 * Call a remote procedure.
 *
 * @param {string} name The name of the procedure to call
 * @param {!function(INPUT):!jspb.ByteSource} encoder A serializer function that can encode input messages.
 * @param {!function(!jspb.ByteSource):OUTPUT} decoder A serializer function that can decode output messages.
 * @param {!grpc.stream.Observer<OUTPUT>} observer An observer used to recieve events.
 * @param {?grpc.Endpoint=} opt_endpoint Optional additional endpoint configuration.
 * @return {!grpc.stream.Observer<INPUT>} The input observer that the caller should provide events to.
 * @template INPUT
 * @template OUTPUT
 */
grpc.Transport.prototype.call = function(name, encoder, decoder, observer, opt_endpoint) {};
