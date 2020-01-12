goog.provide('grpc.stream.Observer');


/**
 * A stream observer that receives messages of type <T extends
 * jspb.Message>.
 *
 * @interface
 * @template T
 */
grpc.stream.Observer = function() {};


/**
 * Metadata callback for a stream.  This function is used to report
 * header or trailer key:values as they arrive on the stream.
 *
 * @param {!Object<string,string>} headers Headers
 * @param {grpc.Status} status Current grpcStatus code
 * @param {boolean=} opt_isTrailing Flag set if these are Trailers
 */
grpc.stream.Observer.prototype.onProgress = function(headers, status, opt_isTrailing) {};


/**
 * Success value callback for a stream.
 *
 * @param {T} value The protobuf value
 */
grpc.stream.Observer.prototype.onNext = function(value) {};


/**
 * Error value callback for a stream.
 *
 * @param {!grpc.Rejection} err A struct with the status code, message, and headers that detail the error.
 */
grpc.stream.Observer.prototype.onError = function(err) {};


/**
 * Stream termination callback.
 */
grpc.stream.Observer.prototype.onCompleted = function() {};
