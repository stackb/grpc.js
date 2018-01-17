goog.module('grpc.stream.observer.UnaryCallResolver');

const CallResolver = goog.require('grpc.stream.observer.CallResolver');
const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('grpc.stream.observer.EventType');
const GrpcStatus = goog.require('grpc.Status');


/**
 * Base observer implementation that watches for stream events.  If an
 * error occurs, promise will reject with a Rejection. This base
 * implementation is suitable for a unary call as it will resolve on
 * the first message.
 *
 * @extends {EventTarget}
 * @implements {CallResolver<T>}
 * @template T
 */
class UnaryCallResolver extends EventTarget {

  /**
   * @param {!goog.promise.Resolver<T>} resolver
   */
  constructor(resolver) {
    super();

    /** @protected @type {!goog.promise.Resolver<T>} */
    this.resolver = resolver;

    /** @private @type {GrpcStatus|undefined} */
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
      throw new Error("Illegal state (onCompleted called more than once)");
    }
    const rejection = {
      status: this.status_ || GrpcStatus.UNKNOWN,
      message: this.message_ || "Error message unknown",
      headers: this.headers_ || {},
      trailers: this.trailers_ || {},
    };
    this.resolver.reject(rejection);
    delete this.resolver;
  }


  /**
   * @override
   * @param {!Object<string,string>} headers Headers
   * @param {GrpcStatus} status Current grpcStatus code
   * @param {boolean=} opt_isTrailing Flag set if these are Trailers
   */
  onProgress(headers, status, opt_isTrailing) {
    console.warn("onProgress: ", status + " HEADERS: " + opt_isTrailing, headers);
    const grpcStatus = this.getGrpcStatus(headers);
    console.warn("onProgress grpcStatus: ", grpcStatus);
    if (goog.isDefAndNotNull(grpcStatus)) {
      this.status_ = grpcStatus;
    }
    const grpcMessage = this.getGrpcMessage(headers);
    if (goog.isDefAndNotNull(grpcMessage)) {
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
    //return;
  }

  
  /**
   * @override
   */
  onNext(value) {
    console.log("onNext", this);
    if (!this.resolver) {
      throw new Error("Illegal state (onNext called after procedure completed)");
    }
    this.value_ = value;
    //return this;
  }

  
  /**
   * @override
   */
  onError(message, status) {
    console.log("onError", this);
    if (!this.resolver) {
      throw new Error("Illegal state (onError called after procedure completed)");
    }
    this.message_ = message;
    this.status_ = status;
    if (this.hasListener(EventType.ERROR)) {
      this.dispatchEvent(EventType.ERROR);
    }    
    this.handleReject();
    //return this;
  }


  /**
   * @override
   */
  onCompleted() {
    console.log("onCompleted", this);
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

    //return this;
  }


  /**
   * @protected
   * @param {?Object<string,string>} headers
   * @return {GrpcStatus|undefined}
   */
  getGrpcStatus(headers) {
    if (headers) {
      try {
        let grpcStatus = headers["Grpc-Status"];
        if (!goog.isDefAndNotNull(grpcStatus)) {
          grpcStatus = headers["grpc-status"];
        }
        if (!goog.isDefAndNotNull(grpcStatus)) {
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

exports = UnaryCallResolver;
