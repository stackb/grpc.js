goog.module('grpc.Options');

// What is the best api 
/**
 * Dial options for grpc transports.
 */
class Options {

  /**
   * Create new options object.
   * 
   * @param {?(function(string):?Map<string,string>)=} opt_per_rpc_metadata
   * @param {string=} opt_host
   * @param {number=} opt_port
   */
  constructor(opt_per_rpc_metadata, opt_host, opt_port) {

    /**
     * @private
     * @type {function(string):?Map<string,string>}
     */
    this.per_rpc_metadata_ = opt_per_rpc_metadata || function(endpoint) { return null; };
    
    /**
     * @private
     * @type {string}
     */
    this.host_ = opt_host || "";

    /**
     * @private
     * @type {number}
     */
    this.port_ = opt_port || 0;
    
  }

  /**
   * @return {string}
   */
  getHost() {
    return this.host_;
  }

  /**
   * @return {number}
   */
  getPort() {
    return this.port_;
  }
  
  /**
   * @return {function(string):?Map<string,string>}
   */
  getPerRpcMetadata() {
    return this.per_rpc_metadata_;
  }
  
}

exports = Options;
