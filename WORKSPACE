workspace(name = "com_github_stackb_grpc_js")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

# ================================================================

RULES_CLOSURE_VERSION = "7448ab3b1f53db99419a2b1a1b84f9ba2d79ec03"

http_archive(
    name = "io_bazel_rules_closure",
    url = "https://github.com/bazelbuild/rules_closure/archive/%s.zip" % RULES_CLOSURE_VERSION,
    strip_prefix = "rules_closure-%s" % RULES_CLOSURE_VERSION,
)

load("@io_bazel_rules_closure//closure:defs.bzl", "closure_repositories")

closure_repositories()