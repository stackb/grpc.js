
licenses(["notice"])  # Apache 2.0

load("@io_bazel_rules_closure//closure/compiler:closure_js_library.bzl", "closure_js_library")

closure_js_library(
    name = "pb",
    srcs = ["@com_google_protobuf_js//:proto_js_library_files"],
    suppress = [
        "JSC_EXTRA_REQUIRE_WARNING",
        "JSC_IMPLICITLY_NULLABLE_JSDOC",
        "JSC_NTI_ADDING_PROPERTY_TO_NON_OBJECT",
        "JSC_NTI_CANNOT_MAKE_TYPEVAR_NON_NULL",
        "JSC_NTI_ILLEGAL_PROPERTY_ACCESS",
        "JSC_NTI_INEXISTENT_PROPERTY",
        "JSC_NTI_INVALID_ARGUMENT_TYPE",
        "JSC_NTI_INVALID_OPERAND_TYPE",
        "JSC_NTI_MISTYPED_ASSIGN_RHS",
        "JSC_NTI_NULLABLE_DEREFERENCE",
        "JSC_NTI_POSSIBLY_INEXISTENT_PROPERTY",
        "JSC_NTI_PROPERTY_ACCESS_ON_NONOBJECT",
        "JSC_NTI_RETURN_NONDECLARED_TYPE",
        "JSC_NTI_UNION_IS_UNINHABITABLE",
        "JSC_NTI_UNKNOWN_EXPR_TYPE",
        "JSC_NTI_WRONG_ARGUMENT_COUNT",
        "JSC_NULLABLE_RETURN_WITH_NAME",
        "JSC_OPTIONAL_PARAM_NOT_MARKED_OPTIONAL",
        "JSC_UNKNOWN_EXPR_TYPE",
    ],
    deps = ["@io_bazel_rules_closure//closure/library"],
    visibility = ["//visibility:public"],
)
