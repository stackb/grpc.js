goog.provide('grpc.stream.observer.EventType');

/**
 * @public
 * @enum {string}
 */
grpc.stream.observer.EventType = {
  MESSAGE: 'message',
  ERROR: 'error',
  HEADERS: 'headers',
  TRAILERS: 'trailers',
  COMPLETE: 'complete',
};
