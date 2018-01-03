package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
)

closure_js_library(
    name = "observer",
    srcs = [
        "observer.js",
        "rejection.js",
    ],
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)
