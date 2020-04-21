goog.module('grpc.Observer');

const Rejection = goog.require('grpc.Rejection');
const Status = goog.require('grpc.Status');


/**
 * A stream observer that receives messages of type <T extends
 * jspb.Message>.
 *
 * @interface
 * @template T
 */
const Observer = function () { };


/**
 * Metadata callback for a stream.  This function is used to report
 * header or trailer key:values as they arrive on the stream.
 *
 * @param {!Object<string,string>} headers Headers
 * @param {!Status} status Current grpcStatus code
 * @param {boolean=} opt_isTrailing Flag set if these are Trailers
 */
Observer.prototype.onProgress = function (headers, status, opt_isTrailing) { };


/**
 * Success value callback for a stream.
 *
 * @param {T} value The protobuf value
 */
Observer.prototype.onNext = function (value) { };


/**
 * Error value callback for a stream.
 *
 * @param {!Rejection} err A struct with the status code, message, and headers that detail the error.
 */
Observer.prototype.onError = function (err) { };


/**
 * Stream termination callback.
 */
Observer.prototype.onCompleted = function () { };

exports = Observer;