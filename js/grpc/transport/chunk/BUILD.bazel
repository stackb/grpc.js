package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
    "closure_js_test",
    "closure_js_binary",
)

closure_js_library(
    name = "chunk",
    srcs = [
        "object.js",
        "parser.js",
    ],
    deps = [
        "@io_bazel_rules_closure//closure/library",
    ],
)

closure_js_test(
    name = "parser_test",
    size = "small",
    srcs = [
        "parser_test.js",
    ],
    entry_points = ["goog:grpc.transport.chunk.ParserTest"],
    deps = [
        ":chunk",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/library:testing",
    ],
)
