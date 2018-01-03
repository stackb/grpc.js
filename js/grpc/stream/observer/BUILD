package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
)

closure_js_library(
    name = "call",
    srcs = [
        "eventtype.js",
        "callresolver.js",
        "unarycallresolver.js",
        "streamingcallresolver.js",
    ],
    suppress = [
        "JSC_UNKNOWN_EXPR_TYPE",
    ],
    deps = [
        "//js/grpc",
        "//js/grpc/stream:observer",
        "@io_bazel_rules_closure//closure/library",
    ],
)

# Next: create a grpc.Application or grpc.Api base class that can be
# configurable.  Remove the endpoint args from the calls.  Make the
# constructor arg the api object rather than the transport.  Make a
# getTransport() method that abstracts the transport.  Start testing
# the streaming endpoint.
