package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
)

closure_js_library(
    name = "observer",
    srcs = [
        "observer.js",
    ],
    deps = [
        "//js/grpc",
        "@io_bazel_rules_closure//closure/library",
    ],
)
