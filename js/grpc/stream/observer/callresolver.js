goog.provide('grpc.stream.observer.CallResolver');
goog.provide('grpc.stream.observer.Rejection');

//goog.require('goog.Thenable');


/**
 * @interface
 * @extends {grpc.stream.Observer<T>}
 * @template T
 */
grpc.stream.observer.CallResolver = function() {
};

/**
 * @type {!goog.Promise<T>}
 */
grpc.stream.observer.CallResolver.prototype.promise;



