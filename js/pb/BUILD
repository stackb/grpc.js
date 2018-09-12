
licenses(["notice"])  # Apache 2.0

load("@io_bazel_rules_closure//closure/compiler:closure_js_library.bzl", "closure_js_library")

closure_js_library(
    name = "pb",
    srcs = ["@com_google_protobuf_js//:proto_js_library_files"],
    suppress = [
        "JSC_EXTRA_REQUIRE_WARNING",
        "JSC_IMPLICITLY_NULLABLE_JSDOC",
        "JSC_NULLABLE_RETURN_WITH_NAME",
        "JSC_OPTIONAL_PARAM_NOT_MARKED_OPTIONAL",
        "JSC_UNKNOWN_EXPR_TYPE",
        "JSC_PREFER_BACKTICKS_TO_AT_SIGN_CODE",
    ],
    deps = ["@io_bazel_rules_closure//closure/library"],
    visibility = ["//visibility:public"],
)
