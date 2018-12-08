
licenses(["notice"])  # Apache 2.0

load("@io_bazel_rules_closure//closure/compiler:closure_js_library.bzl", "closure_js_library")

closure_js_library(
    name = "pb",
    srcs = ["@com_google_protobuf_js//:proto_js_library_files"],
    lenient = True,
    deps = ["@io_bazel_rules_closure//closure/library"],
    visibility = ["//visibility:public"],
)
