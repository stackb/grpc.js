package(default_visibility = ["//visibility:public"])

load("@io_bazel_rules_go//go:def.bzl", "go_binary", "go_library")

go_library(
    name = "generator",
    srcs = [
        "generator/generator.go",
    ],
    deps = [
        "@com_github_golang_protobuf//proto:go_default_library",
        "@com_github_golang_protobuf//protoc-gen-go/descriptor:go_default_library",
        "@com_github_golang_protobuf//protoc-gen-go/plugin:go_default_library",
        "@com_github_davecgh_go_spew//spew:go_default_library",
    ],
)

go_binary(
    name = "protoc-gen-grpc-js",
    srcs = [
        "main.go",
    ],
    deps = [
        ":generator",
        "@com_github_golang_protobuf//proto:go_default_library",
    ],
)
