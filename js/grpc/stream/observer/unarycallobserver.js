goog.module('grpc.stream.observer.UnaryCallObserver');

const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('grpc.stream.observer.EventType');
const GrpcStatus = goog.require('grpc.Status');
const Observer = goog.require('grpc.Observer');
const Resolver = goog.require('goog.promise.Resolver');


/**
 * Base observer implementation that watches for stream events.  If an
 * error occurs, promise will reject with a Rejection. This base
 * implementation is suitable for a unary call as it will resolve on
 * the first message.
 *
 * @extends {EventTarget}
 * @implements {Observer<T>}
 * @template T
 */
class UnaryCallObserver extends EventTarget {

  /**
   * @param {!Resolver<T>} resolver
   */
  constructor(resolver) {
    super();

    /** @protected */
    this.resolver = resolver;

    /** @private @type {?GrpcStatus|undefined} */
    this.status_ = undefined;

    /** @private @type {string|undefined} */
    this.message_ = undefined;

    /** @private @type {!Object<string,string>|undefined} */
    this.headers_ = undefined;

    /** @private @type {!Object<string,string>|undefined} */
    this.trailers_ = undefined;

    /** @private @type {T} */
    this.value_ = undefined;
  }

  /**
   * Base implementation resolves with the final message value.
   *
   * @protected
   */
  handleResolve() {
    if (!this.resolver) {
      throw new Error("Illegal state (resolve called more than once)");
    }
    this.resolver.resolve(this.value_);
    delete this.resolver;
  }


  /**
   * Base implementation rejects with a Rejection object.
   *
   * @protected
   */
  handleReject() {
    if (!this.resolver) {
      throw new Error("Illegal state (completion called more than once)");
    }
    const rejection = {
      status: this.status_ || GrpcStatus.UNKNOWN,
      message: this.message_ || "Error message unknown",
      headers: this.headers_ || {},
      trailers: this.trailers_ || {},
    };

    // console.log("observer.handleReject: sending rejection to resolver: ", this.resolver);

    this.resolver.reject(rejection);
    delete this.resolver;
  }


  /**
   * @override
   * @param {!Object<string,string>} headers Headers
   * @param {!GrpcStatus} status Current grpcStatus code
   * @param {boolean=} opt_isTrailing Flag set if these are Trailers
   */
  onProgress(headers, status, opt_isTrailing) {
    // console.warn("onProgress: ", status + " HEADERS: " + opt_isTrailing, headers);
    const grpcStatus = this.getGrpcStatus(headers);
    //console.warn("onProgress grpcStatus: ", grpcStatus);
    if (grpcStatus != null) {
      this.status_ = grpcStatus;
    }
    const grpcMessage = this.getGrpcMessage(headers);
    if (grpcMessage != null) {
      this.message_ = grpcMessage;
    }
    if (opt_isTrailing) {
      this.trailers_ = headers;
      if (this.hasListener(EventType.TRAILERS)) {
        this.dispatchEvent(EventType.TRAILERS);
      }
    } else {
      this.headers_ = headers;
      if (this.hasListener(EventType.HEADERS)) {
        this.dispatchEvent(EventType.HEADERS);
      }
    }
  }


  /**
   * @override
   */
  onNext(value) {
    // console.log("onNext", this);
    if (!this.resolver) {
      throw new Error("Illegal state (onNext called after procedure completed)");
    }
    this.value_ = value;
  }


  /**
   * @override
   */
  onError(err) {
    // console.log("observer.onError", err);
    if (!this.resolver) {
      throw new Error("Illegal state (onError called after procedure completed)");
    }
    this.message_ = err.message;
    this.status_ = err.status;
    if (this.hasListener(EventType.ERROR)) {
      this.dispatchEvent(EventType.ERROR);
    }
    this.handleReject();
  }


  /**
   * @override
   */
  onCompleted() {
    //console.log("onCompleted", this);
    if (!this.resolver) {
      throw new Error("Illegal state (onCompleted called more than once)");
    }
    if (this.hasListener(EventType.COMPLETE)) {
      this.dispatchEvent(EventType.COMPLETE);
    }

    if (this.status_) {
      this.handleReject();
    } else {
      this.handleResolve();
    }
  }


  /**
   * @protected
   * @param {?Object<string,string>} headers
   * @return {!GrpcStatus|undefined}
   */
  getGrpcStatus(headers) {
    if (headers) {
      try {
        let grpcStatus = headers["Grpc-Status"];
        if (grpcStatus == null) {
          grpcStatus = headers["grpc-status"];
        }
        if (grpcStatus == null) {
          return undefined;
        }
        const statusCode = /** @type {!GrpcStatus} */ (parseInt(grpcStatus, 10));
        return statusCode;
      } catch (e) {
        return undefined;
      }
    } else {
      return undefined;
    }
  }


  /**
   * Return the 'Grpc-Message' response header value.
   *
   * @protected
   * @param {?Object<string,string>=} headers
   * @return {string|undefined}
   */
  getGrpcMessage(headers) {
    return headers["Grpc-Message"] || headers["grpc-message"] || undefined;
  }

}

exports = UnaryCallObserver;
