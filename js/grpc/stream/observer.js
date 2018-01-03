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
 * retur {!grpc.stream.Observer<T>}
 */
grpc.stream.Observer.prototype.onProgress = function(headers, status, opt_isTrailing) {};


/**
 * Success value callback for a stream.
 *
 * @param {T} value The protobuf value
 * retur {!grpc.stream.Observer<T>}
 */
grpc.stream.Observer.prototype.onNext = function(value) {};


/**
 * Error value callback for a stream.
 *
 * @param {string} message A human-readable string that explains the error.
 * @param {grpc.Status} status The status code associated with the error.
 * retur {!grpc.stream.Observer<T>}
 */
grpc.stream.Observer.prototype.onError = function(message, status) {};


/**
 * Stream termination callback.
 * retur {!grpc.stream.Observer<T>}
 */
grpc.stream.Observer.prototype.onCompleted = function() {};
