/**
 * @fileoverview grpc Transport interface.
 *
 */
goog.module('grpc.Endpoint');

/**
 * Metadata about a procedure endpoint that is used to make a call.
 * All attributes are optional. 'path' is a prefix such as '/api/v1' used to route
 * at the server.
 * 
 * An optional transport name can be requested.  Allowed values are enum Transport.Type.
 *
  * @typedef{{
    path:(string|undefined),
    host:(string|undefined),
    port:(number|undefined),
    transport:(string|undefined),
  }}
 */
var Endpoint;


exports = Endpoint;
