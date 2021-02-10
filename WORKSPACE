workspace(name = "com_github_stackb_grpc_js")

local_repository(
    name = "build_stack_rules_proto",
    path = "../rules_proto",
)

load(
    "@build_stack_rules_proto//:deps.bzl",
    "bazel_gazelle",
    "bazel_skylib",
    "com_github_grpc_grpc",
    "com_google_protobuf",
    "io_bazel_rules_closure",
    "io_bazel_rules_go",
    "rules_cc",
    "zlib",
)

# ==================================================
# C++
# ==================================================
#
rules_cc()

# ==================================================
# Go
# ==================================================
#
io_bazel_rules_go()

bazel_gazelle()

load("@io_bazel_rules_go//go:deps.bzl", "go_register_toolchains", "go_rules_dependencies")

go_rules_dependencies()

go_register_toolchains()

load("@bazel_gazelle//:deps.bzl", "gazelle_dependencies")

gazelle_dependencies()

# ==================================================
# closure
# ==================================================
#
io_bazel_rules_closure()

load("@io_bazel_rules_closure//closure:repositories.bzl", "rules_closure_dependencies", "rules_closure_toolchains")

rules_closure_dependencies(
    omit_bazel_skylib = True,
    omit_com_google_protobuf = True,
    omit_zlib = True,
)

rules_closure_toolchains()

# ==================================================
# Protobuf
# ==================================================
#
com_google_protobuf()

bazel_skylib()

zlib()

# ==================================================
# gRPC
# ==================================================
#
com_github_grpc_grpc()

load("@com_github_grpc_grpc//bazel:grpc_deps.bzl", "grpc_deps")

grpc_deps()
