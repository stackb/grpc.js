goog.module('grpc.stream.observer.StreamingCallObserver');

const UnaryCallObserver = goog.require('grpc.stream.observer.UnaryCallObserver');


/**
 * Observer implementation that watches for stream events.  It
 * resolves to void but propagates protobuf messages to the onMessage
 * constructor argument.
 *
 * @extends {UnaryCallObserver<T>}
 * @template T
 */
class StreamingCallObserver extends UnaryCallObserver {

  /**
   * @param {!goog.promise.Resolver<?>} resolver
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
    // console.info("stream callback", value);
    this.onMessage_(value);
    super.onNext(value);
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

exports = StreamingCallObserver;
