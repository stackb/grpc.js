# ================================================================

JSPB_BUILD = """
package(default_visibility = ["//visibility:public"])

licenses(["notice"])  # BSD

filegroup(
    name = "proto_js_library_files",
    srcs = [
        "binary/arith.js",
        "binary/constants.js",
        "binary/decoder.js",
        "binary/encoder.js",
        "binary/reader.js",
        "binary/utils.js",
        "binary/writer.js",
        "debug.js",
        "map.js",
        "message.js",
    ],
)
"""

new_http_archive(
    name = "com_google_protobuf_js",
    urls = [
        "https://github.com/google/protobuf/archive/v3.5.1.zip",  # 2017-07-17
    ],
    sha256 = "1f8b9b202e9a4e467ff0b0f25facb1642727cdf5e69092038f15b37c75b99e45",
    strip_prefix = "protobuf-3.5.1/js",
    build_file_content = JSPB_BUILD,
)

http_archive(
    name = "io_bazel_rules_closure",
    url = "https://github.com/bazelbuild/rules_closure/archive/4af89ef1db659eb41f110df189b67d4cf14073e1.zip",
    sha256 = "f73b1b3974e7639183e1646737d446d73a966ff57f853a896e19bcccc40e9b7b",
    strip_prefix = "rules_closure-4af89ef1db659eb41f110df189b67d4cf14073e1",
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories(
    omit_com_google_protobuf_js = True,
)

# ================================================================

http_archive(
    name = "io_bazel_rules_go",
    url = "https://github.com/bazelbuild/rules_go/releases/download/0.5.5/rules_go-0.5.5.tar.gz",
    sha256 = "ca58b0b856dc95473b93f2228ab117913b82a6617fc0deabd107346e3981522a",
)
load("@io_bazel_rules_go//go:def.bzl", "go_repositories", "go_repository")

go_repositories()

go_repository(
    name = "com_github_improbable_eng_grpc_web",
    importpath = "github.com/improbable-eng/grpc-web",
    commit = "8dc2066176c4f2dec8444a06b72d7ba263f65588",
)

go_repository(
    name = "com_github_davecgh_go_spew",
    importpath = "github.com/davecgh/go-spew",
    commit = "a476722483882dd40b8111f0eb64e1d7f43f56e4",
)

go_repository(
    name = "com_golang_google_genproto",
    importpath = "google.golang.org/genproto",
    commit = "3273178ea4684acc4f512f7bef7349dd72db88f6",
)

go_repository(
    name = "org_golang_x_oauth2",
    importpath = "github.com/golang/oauth2",
    commit = "bb50c06baba3d0c76f9d125c0719093e315b5b44",
)

go_repository(
    name = "org_golang_x_tools",
    importpath = "github.com/golang/tools",
    commit = "9b61fcc4c548d69663d915801fc4b42a43b6cd9c",
)

# ================================================================

local_repository(
    name = "org_pubref_rules_protobuf",
    path = "/home/pcj/github/pubref/rules_protobuf",
)

# http_archive(
#     name = "org_pubref_rules_protobuf",
#     url = "https://github.com/pubref/rules_protobuf/archive/0ce5738cd67925351c44df0845c3bbf9d1d32663.zip",
#     strip_prefix = "rules_protobuf-0ce5738cd67925351c44df0845c3bbf9d1d32663",
#     #sha256 = "72bbb8fd2e47ab4ca2cc6ef46ab062e989e4144b01d209b6ed4257ddfa95a93f",
# )


load("@org_pubref_rules_protobuf//closure:rules.bzl", "closure_proto_repositories")
closure_proto_repositories()

load("@org_pubref_rules_protobuf//go:rules.bzl", "go_proto_repositories")
go_proto_repositories()


# ================================================================

http_archive(
    name = "org_pubref_rules_node",
    url = "https://github.com/pubref/rules_node/archive/277a65cebb86ef0a0895a7940e7b829c35a814e2.zip",
    sha256 = "54e366ebb9afb365b459fd73d8f9730e99ed7677ad13b434699ec68a02576039",
    strip_prefix = "rules_node-277a65cebb86ef0a0895a7940e7b829c35a814e2",
)

load("@org_pubref_rules_node//node:rules.bzl", "node_repositories", "yarn_modules")

node_repositories()

yarn_modules(
    name = "yarn_modules",
    deps = {
        "window": "4.2.4",
    },
)
