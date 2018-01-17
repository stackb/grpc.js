goog.module('grpc.stream.observer.StreamingCallResolver');

const UnaryCallResolver = goog.require('grpc.stream.observer.UnaryCallResolver');


/**
 * Observer implementation that watches for stream events.  It
 * resolves to void but propagates protobuf messages to the onMessage
 * constructor argument.
 *
 * @extends {UnaryCallResolver<T>}
 * @template T
 */
class StreamingCallResolver extends UnaryCallResolver {

  /**
   * @param {!goog.promise.Resolver} resolver
   * @param {!function(T)} onMessage
   */
  constructor(resolver, onMessage) {
    super(resolver);
    this.onMessage_ = onMessage;
  }

  /**
   * @override
   */
  onNext(value) {
    this.onMessage_(value);
    return super.onNext(value);
  }

  
  /**
   * @override
   */
  handleResolve() {
    if (!this.resolver) {
      throw new Error("Illegal state (resolve called more than once)");
    }
    this.resolver.resolve();
    delete this.resolver;
  }
  
}

exports = StreamingCallResolver;
