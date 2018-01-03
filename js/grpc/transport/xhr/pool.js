goog.provide('grpc.transport.xhr.Pool');

/**
 * @interface
 */
grpc.transport.xhr.Pool = function() {};


/**
 * Get an Xhr object from the pool.
 * @return {!goog.net.XhrIo}
 */
grpc.transport.xhr.Pool.getObject = function() {};


/**
 * Return an Xhr object to the pool.
 * @param {!goog.net.XhrIo} xhr
 */
grpc.transport.xhr.Pool.releaseObject = function(xhr) {};
