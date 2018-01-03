goog.provide('grpc.stream.Rejection');


/**
 * Response type provided resolver.reject method if the call errors
 * out.  
 *
 * @typedef{{
 message:string,
 status:grpc.Status,
 headers:(!Object<string,string>),
 trailers:(!Object<string,string>),
 }}
*/
grpc.stream.Rejection;
