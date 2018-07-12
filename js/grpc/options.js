goog.module('grpc.Options');

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
   * @param {string=} opt_path
   */
  constructor(opt_per_rpc_metadata, opt_host, opt_port, opt_path) {

    /**
     * @private
     * @type {function(string):?Map<string,string>}
     */
    this.per_rpc_metadata_ = opt_per_rpc_metadata || function(endpoint) { return null; };
    
    /**
     * @const @private
     * @type {string}
     */
    this.host_ = opt_host || "";

    /**
     * @const @private
     * @type {number}
     */
    this.port_ = opt_port || 0;

    /**
     * @const @private
     * @type {string}
     */
    this.path_ = opt_path || "";
    
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
   * @return {string}
   */
  getPath() {
    return this.path_;
  }
  
  /**
   * @return {function(string):?Map<string,string>}
   */
  getPerRpcMetadata() {
    return this.per_rpc_metadata_;
  }

  /**
   * @param {function(string):?Map<string,string>} per_rpc_metadata
   */
  setPerRpcMetadata(per_rpc_metadata) {
    this.per_rpc_metadata_ = per_rpc_metadata;
  }
  
}

exports = Options;
