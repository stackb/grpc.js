load("@io_bazel_rules_closure//closure:defs.bzl",
     "closure_js_library",
     "closure_js_test")
load("@org_pubref_rules_protobuf//protobuf:rules.bzl",
     "proto_compile",
     "proto_repositories")

def grpc_js_proto_compile(langs = [str(Label("//bzl:grpc.js"))], **kwargs):
  proto_compile(langs = langs, **kwargs)

def grpc_js_proto_library(
    name,
    langs = [str(Label("//bzl:grpc.js"))],
    protos = [],
    imports = [],
    inputs = [],
    proto_deps = [],
    output_to_workspace = False,
    closure_proto_compile_args = {},
    grpc_js_proto_compile_args = {},
    srcs = [],
    deps = [],
    with_grpc = True,
    verbose = 0,
    **kwargs):

  closure_proto_compile_args += {
    "name": name + ".pb",
    "protos": protos,
    "deps": [dep + ".pb" for dep in proto_deps],
    "langs": [str(Label("@org_pubref_rules_protobuf//closure"))],
    "imports": imports,
    "inputs": inputs,
    "output_to_workspace": output_to_workspace,
    "verbose": verbose,
  }

  proto_compile(**closure_proto_compile_args)

  grpc_js_proto_compile_args += {
    "name": name + ".grpc",
    "protos": protos,
    "deps": [dep + ".grpc" for dep in proto_deps],
    "langs": langs,
    "imports": imports,
    "inputs": inputs,
    "output_to_workspace": output_to_workspace,
    "with_grpc": with_grpc,
    "verbose": verbose,
  }

  proto_compile(**grpc_js_proto_compile_args)

  all_js_deps = depset(deps + proto_deps + [
      "@io_bazel_rules_closure//closure/library",
      "@io_bazel_rules_closure//closure/protobuf:jspb",
      "@build_stack_grpc_js//js/grpc/stream:observer",
      "@build_stack_grpc_js//js/grpc/stream/observer:call",
      "@build_stack_grpc_js//js/grpc",
      "@build_stack_grpc_js//js/grpc:api",
    ]).to_list()

  closure_js_library(
    name = name,
    srcs = srcs + [name + ".pb"] + [name + ".grpc"],
    suppress = [
        "analyzerChecks",
        "missingProperties",
        "reportUnknownTypes",
        "unusedLocalVariables",
    ],
    deps = all_js_deps,
    **kwargs)
