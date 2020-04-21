package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
)

closure_js_library(
    name = "call",
    srcs = [
        "eventtype.js",
        "unarycallobserver.js",
        "streamingcallobserver.js",
    ],
    suppress = [
        "JSC_UNKNOWN_EXPR_TYPE",
    ],
    deps = [
        "//js/grpc",
        "@io_bazel_rules_closure//closure/library",
    ],
)
