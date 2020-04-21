goog.module('grpc.stream.observer.EventType');

/**
 * @public
 * @enum {string}
 */
exports = {
  MESSAGE: 'message',
  ERROR: 'error',
  HEADERS: 'headers',
  TRAILERS: 'trailers',
  COMPLETE: 'complete',
};
