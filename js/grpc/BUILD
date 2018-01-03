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
        "status.js",
        "endpoint.js",
    ],
    deps = [
        "//js/grpc/stream:observer",
        "@io_bazel_rules_closure//closure/library",
        "//js/pb",
    ],
)

closure_js_library(
    name = "api",
    srcs = [
        "api.js",
        "options.js",
    ],
    deps = [
        ":grpc",
        "//js/grpc/transport:xhr",
        "@io_bazel_rules_closure//closure/library",
    ],
)

