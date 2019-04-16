package(default_visibility = ["//visibility:public"])

load(
    "@io_bazel_rules_closure//closure:defs.bzl",
    "closure_js_library",
    "closure_js_test",
)

closure_js_library(
    name = "loopback",
    srcs = [
        "loopback.js",
    ],
    suppress = [
        "reportUnknownTypes",
    ],
    deps = [
        "//js/grpc/stream:observer",
        "//js/grpc",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
)

closure_js_library(
    name = "xhr",
    srcs = [
        "xhr.js",
        "xhr/factory.js",
        "xhr/observer.js",
    ],
    suppress = [
        "reportUnknownTypes",
    ],
    deps = [
        "//js/grpc/stream:observer",
        "//js/grpc",
        "//js/grpc:options",
        "//js/grpc/transport/chunk",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
)

closure_js_library(
    name = "base_observer",
    srcs = [
        "base_observer.js",
    ],
    deps = [
        "//js/grpc/stream:observer",
        "//js/grpc",
        "//js/grpc:options",
        "//js/grpc/transport/chunk",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
)

closure_js_library(
    name = "fetch",
    srcs = [
        "fetch.js",
        "fetch/observer.js",
    ],
    deps = [
        ":base_observer",
        "//js/grpc/stream:observer",
        "//js/grpc",
        "//js/grpc:options",
        "//js/grpc/transport/chunk",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
)


closure_js_test(
    name = "xhr_test",
    srcs = [
        "xhr/observer_test.js",
    ],
    deps = [
        ":xhr",
        "//js/grpc",
        "//js/grpc:options",
        "//js/grpc/stream:observer",
        "@io_bazel_rules_closure//closure/library",
        "@io_bazel_rules_closure//closure/library/ui:component",
        "@io_bazel_rules_closure//closure/library:testing",
        "@io_bazel_rules_closure//closure/protobuf:jspb",
    ],
    suppress = [
        "JSC_INVALID_CAST",
    ],
    entry_points = ["goog:grpc.transport.xhr.ObserverTest"],
)
