goog.provide('grpc.stream.observer.Rejection');


/**
 * Response type provided resolver.reject method if the call errors
 * out.  
 *
 * @typedef{{
 message:string,
 status:grpc.Status,
 headers:(?Object<string,string>|undefined),
 trailers:(?Object<string,string>|undefined),
 }}
*/
grpc.stream.observer.Rejection;
