/**
 * @fileoverview grpc Transport interface.
 *
 */
goog.provide('grpc.Endpoint');


/**
 * Metadata about a procedure endpoint that is used to make a call.
 * All attributes are optional. 'path' is a prefix such as '/api/v1' used to route
 * at the server.
 *
  * @typedef{{
    path:(string|undefined),
    host:(string|undefined),
    port:(number|undefined),
  }}
 */
grpc.Endpoint;
