package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
    "closure_js_test",
    "closure_js_binary",
)

closure_js_library(
    name = "grpc",
    srcs = [
        "transport.js",
        "observer.js",
        "rejection.js",
        "status.js",
        "endpoint.js",
    ],
    deps = [
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
)

closure_js_library(
    name = "api",
    srcs = [
        "api.js",
    ],
    deps = [
        ":grpc",
        ":options",
        "//js/grpc/transport:xhr",
        "//js/grpc/transport:fetch",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/library/labs/useragent:browser",
    ],
)

closure_js_library(
    name = "options",
    srcs = [
        "options.js",
    ],
    deps = [
        ":grpc",
        "@io_bazel_rules_closure//closure/library",
    ],
)
