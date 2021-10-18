/**
 *
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

#include <google/protobuf/compiler/code_generator.h>
#include <google/protobuf/compiler/plugin.h>
#include <google/protobuf/descriptor.h>
#include <google/protobuf/io/printer.h>
#include <google/protobuf/io/zero_copy_stream.h>
#include <algorithm>
#include <sstream>

using google::protobuf::Descriptor;
using google::protobuf::FieldDescriptor;
using google::protobuf::FileDescriptor;
using google::protobuf::MethodDescriptor;
using google::protobuf::ServiceDescriptor;
using google::protobuf::compiler::CodeGenerator;
using google::protobuf::compiler::GeneratorContext;
using google::protobuf::compiler::ParseGeneratorParameter;
using google::protobuf::compiler::PluginMain;
using google::protobuf::io::Printer;
using google::protobuf::io::ZeroCopyOutputStream;

namespace grpc
{
    namespace js
    {
        namespace
        {

            using std::string;

            string LowercaseFirstLetter(string s)
            {
                if (s.empty())
                {
                    return s;
                }
                s[0] = ::tolower(s[0]);
                return s;
            }

            string UppercaseFirstLetter(string s)
            {
                if (s.empty())
                {
                    return s;
                }
                s[0] = ::toupper(s[0]);
                return s;
            }

            string Basename(const string s, const char sep)
            {
                return {std::find_if(s.rbegin(), s.rend(),
                                     [&sep](char c) { return c == sep; })
                            .base(),
                        s.end()};
            }

            string ToUpperCamel(const std::vector<string> &words)
            {
                string result;
                for (size_t i = 0; i < words.size(); i++)
                {
                    string word = words[i];
                    if (word[0] >= 'a' && word[0] <= 'z')
                    {
                        word[0] = (word[0] - 'a') + 'A';
                    }
                    result += word;
                }
                return result;
            }

            template <typename Out>
            void split(const string &s, char delim, Out result)
            {
                std::stringstream ss(s);
                string item;
                while (std::getline(ss, item, delim))
                {
                    *(result++) = item;
                }
            }

            std::vector<string> split(const string &s, char delim)
            {
                std::vector<string> elems;
                split(s, delim, std::back_inserter(elems));
                return elems;
            }

            string CamelName(const string s, const char sep)
            {
                std::vector<std::string> words = split(s, sep);
                return ToUpperCamel(words);
            }

            void die(const std::string &msg)
            {
                std::cerr << msg << std::endl;
                exit(1);
            }

            // The following 5 functions were copied from
            // google/protobuf/src/google/protobuf/stubs/strutil.h

            inline bool HasSuffixString(const string &str,
                                        const string &suffix)
            {
                return str.size() >= suffix.size() &&
                       str.compare(str.size() - suffix.size(), suffix.size(), suffix) == 0;
            }

            inline string StripSuffixString(const string &str, const string &suffix)
            {
                if (HasSuffixString(str, suffix))
                {
                    return str.substr(0, str.size() - suffix.size());
                }
                else
                {
                    return str;
                }
            }

            // The following function was copied from
            // google/protobuf/src/google/protobuf/compiler/cpp/cpp_helpers.cc

            string StripProto(const string &filename)
            {
                if (HasSuffixString(filename, ".protodevel"))
                {
                    return StripSuffixString(filename, ".protodevel");
                }
                else
                {
                    return StripSuffixString(filename, ".proto");
                }
            }

            // The following 6 functions were copied from
            // google/protobuf/src/google/protobuf/compiler/js/js_generator.cc

            /* Finds all message types used in all services in the file, and returns them
 * as a map of fully qualified message type name to message descriptor */
            std::map<string, const Descriptor *> GetAllMessages(const FileDescriptor *file)
            {
                std::map<string, const Descriptor *> message_types;
                for (int service_index = 0;
                     service_index < file->service_count();
                     ++service_index)
                {
                    const ServiceDescriptor *service = file->service(service_index);
                    for (int method_index = 0;
                         method_index < service->method_count();
                         ++method_index)
                    {
                        const MethodDescriptor *method = service->method(method_index);
                        const Descriptor *input_type = method->input_type();
                        const Descriptor *output_type = method->output_type();
                        message_types[input_type->full_name()] = input_type;
                        message_types[output_type->full_name()] = output_type;
                    }
                }

                return message_types;
            }

            void PrintMessagesDeps(Printer *printer, const FileDescriptor *file)
            {
                std::map<string, const Descriptor *> messages = GetAllMessages(file);
                std::map<string, string> vars;
                for (std::map<string, const Descriptor *>::iterator it = messages.begin();
                     it != messages.end(); it++)
                {
                    vars["full_name"] = it->first;
                    vars["camel_name"] = CamelName(it->first, '.');
                    printer->Print(
                        vars,
                        "const $camel_name$ = goog.require('proto.$full_name$');\n");
                }
                printer->Print("\n\n\n");
            }

            void PrintFileHeader(Printer *printer, const std::map<string, string> &vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * @fileoverview gRPC.js generated client stub for $package$\n"
                    " * @enhanceable\n"
                    " * @public\n"
                    " * @suppress {extraRequire}\n"
                    " */\n\n"
                    "// GENERATED CODE -- DO NOT EDIT!\n\n\n");
            }

            void PrintServiceClass(Printer *printer,
                                   std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * client class for service $service_name$\n"
                    " */\n"
                    "class $service_name$ {\n\n");
            }

            void PrintServiceConstructor(Printer *printer,
                                         std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * @param {!GrpcApi} api\n"
                    " */\n"
                    "constructor(api) {\n"
                    "  /** @private @const @type {!GrpcApi} */\n"
                    "  this.api_ = api;\n"
                    "}\n\n");
            }

            void PrintUnaryCall(Printer *printer, std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * Unary observation of $package$.$service_name$/$method_name$.\n"
                    " *\n"
                    " * @param {!Observer<!$out$>} observer\n"
                    " * @param {!$in$} request\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @suppress {reportUnknownTypes}\n"
                    " */\n"
                    " $js_method_name$Observation(observer, request, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "const input = this.api_.getTransport(opt_endpoint).call(\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "'$package$.$service_name$/$method_name$',\n"
                    "/** @type {!function(!$in$):!jspb.ByteSource} */ (m => m.serializeBinary()),\n"
                    "$out$.deserializeBinary,\n"
                    "observer,\n"
                    "opt_endpoint);\n");
                printer->Outdent();
                printer->Print(
                    vars,
                    "if (opt_headers) { input.onProgress(opt_headers, GrpcStatus.OK); }\n"
                    "input.onNext(request);\n"
                    "input.onCompleted();\n");
                printer->Outdent();
                printer->Print("}\n\n");

                printer->Print(
                    vars,
                    "/**\n"
                    " * $service_name$.$js_method_name$ method (as a promise).\n"
                    " *\n"
                    " * @param {!$in$} request\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @return {!GoogPromise<!$out$,!GrpcRejection>}\n"
                    " */\n"
                    "$js_method_name$(request, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "/** @type{!goog.promise.Resolver<!$out$>} */\n"
                    "const resolver = GoogPromise.withResolver();\n"
                    "const observer = new UnaryCallObserver(resolver);\n"
                    "this.$js_method_name$Observation(observer, request, opt_headers, opt_endpoint);\n"
                    "return resolver.promise;\n");
                printer->Outdent();
                printer->Print("}\n\n");
            }

            void PrintServerStreamingCall(Printer *printer, std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * Server streaming observation of $package$.$service_name$/$method_name$.\n"
                    " *\n"
                    " * @param {!Observer<!$out$>} observer\n"
                    " * @param {!$in$} request\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @suppress {reportUnknownTypes}\n"
                    " */\n"
                    "$js_method_name$Observation(observer, request, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print("const input = this.api_.getTransport(opt_endpoint).call(\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "'$package$.$service_name$/$method_name$',\n"
                    "/** @type {!function(!$in$):!jspb.ByteSource} */ (m => m.serializeBinary()),\n"
                    "$out$.deserializeBinary,\n"
                    "observer,\n"
                    "opt_endpoint);\n");
                printer->Outdent();
                printer->Print(
                    vars,
                    "if (opt_headers) { input.onProgress(opt_headers, GrpcStatus.OK); }\n"
                    "input.onNext(request);\n"
                    "input.onCompleted();\n");
                printer->Outdent();
                printer->Print("}\n");

                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * $service_name$.$method_name$ method (as a promise).\n"
                    " *\n"
                    " * @param {!$in$} request\n"
                    " * @param {!function(!$out$)} onMessage\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @return {!GoogPromise<void,!GrpcRejection>}\n"
                    " */\n"
                    "$js_method_name$(request, onMessage, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "/** @type{!goog.promise.Resolver<void>} */\n"
                    "const resolver = GoogPromise.withResolver();\n"
                    "const observer = new StreamingCallObserver(resolver, onMessage);\n"
                    "this.$js_method_name$Observation(observer, request, opt_headers, opt_endpoint);\n"
                    "return resolver.promise;\n");
                printer->Outdent();
                printer->Print("}\n\n");
            }

            void PrintClientStreamingCall(Printer *printer, std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * Client streaming observation of $package$.$service_name$/$method_name$.\n"
                    " *\n"
                    " * @param {!Observer<!$out$>} observer\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @returns {!Observer<!$in$>}\n"
                    " * @suppress {reportUnknownTypes}\n"
                    " */\n"
                    "$js_method_name$Observation(observer, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print("const input = this.api_.getTransport(opt_endpoint).call(\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "'$package$.$service_name$/$method_name$',\n"
                    "/** @type {!function(!$in$):!jspb.ByteSource} */ (m => m.serializeBinary()),\n"
                    "$out$.deserializeBinary,\n"
                    "observer,\n"
                    "opt_endpoint || { transport: 'websocket' });\n");
                printer->Outdent();
                printer->Print(
                    vars,
                    "if (opt_headers) { input.onProgress(opt_headers, GrpcStatus.OK); }\n"
                    "return input;\n");
                printer->Outdent();
                printer->Print("}\n");

                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * $service_name$.$method_name$ method (as a promise).\n"
                    " *\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @return { { input: !Observer<!$in$>, promise: !GoogPromise<void,!GrpcRejection> } }\n"
                    " */\n"
                    "$js_method_name$(onRequest, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "/** @type{!goog.promise.Resolver<!$out$>} */\n"
                    "const resolver = GoogPromise.withResolver();\n"
                    "const observer = new UnaryCallObserver(resolver);\n"
                    "const input = this.$js_method_name$Observation(observer, opt_headers, opt_endpoint);\n"
                    "return { input: input, promise: resolver.promise };\n");
                printer->Outdent();
                printer->Print("}\n\n");
            }

            void PrintBidiStreamingCall(Printer *printer, std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * Bidi streaming observation of $package$.$service_name$/$method_name$.\n"
                    " *\n"
                    " * @param {!Observer<!$out$>} observer\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @returns {!Observer<!$in$>}\n"
                    " * @suppress {reportUnknownTypes}\n"
                    " */\n"
                    "$js_method_name$Observation(observer, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print("const input = this.api_.getTransport(opt_endpoint).call(\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "'$package$.$service_name$/$method_name$',\n"
                    "/** @type {!function(!$in$):!jspb.ByteSource} */ (m => m.serializeBinary()),\n"
                    "$out$.deserializeBinary,\n"
                    "observer,\n"
                    "opt_endpoint || { transport: 'websocket' });\n");
                printer->Outdent();
                printer->Print(
                    vars,
                    "if (opt_headers) { input.onProgress(opt_headers, GrpcStatus.OK); }\n"
                    "return input;\n");
                printer->Outdent();
                printer->Print("}\n");

                printer->Print(
                    vars,
                    "\n"
                    "/**\n"
                    " * $service_name$.$method_name$ method (as a promise).\n"
                    " *\n"
                    " * @param {!function(!$out$)} onMessage\n"
                    " * @param {?Object<string,string>=} opt_headers\n"
                    " * @param {?GrpcEndpoint=} opt_endpoint\n"
                    " * @return { { input: !Observer<!$in$>, promise: !GoogPromise<void,!GrpcRejection> } }\n"
                    " */\n"
                    "$js_method_name$(onMessage, opt_headers, opt_endpoint) {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "/** @type{!goog.promise.Resolver<void>} */\n"
                    "const resolver = GoogPromise.withResolver();\n"
                    "const observer = new StreamingCallObserver(resolver, onMessage);\n"
                    "const input = this.$js_method_name$Observation(observer, opt_headers, opt_endpoint);\n"
                    "return { input: input, promise: resolver.promise };\n");
                printer->Outdent();
                printer->Print("}\n\n");
            }

            void PrintApiClass(Printer *printer,
                               std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * api class for service implementations\n"
                    " */\n"
                    "class $client_name$Client extends GrpcApi {\n\n");
            }

            void PrintServiceGetter(Printer *printer,
                                    std::map<string, string> vars)
            {
                printer->Print(
                    vars,
                    "/**\n"
                    " * @return {!$service_name$}\n"
                    " */\n"
                    "get$service_name$() {\n");
                printer->Indent();
                printer->Print(
                    vars,
                    "return this.$service_name$_;\n");
                printer->Outdent();
                printer->Print("}\n");
            }

            class GrpcCodeGenerator : public CodeGenerator
            {
            public:
                GrpcCodeGenerator() {}
                ~GrpcCodeGenerator() override {}

                bool Generate(const FileDescriptor *file, const string &parameter,
                              GeneratorContext *context, string *error) const override
                {
                    if (!file->service_count())
                    {
                        // No services, nothing to do.
                        die(file->name() + " does not contain services!");

                        return true;
                    }

                    std::vector<std::pair<string, string>> options;
                    ParseGeneratorParameter(parameter, &options);

                    string file_name;

                    for (size_t i = 0; i < options.size(); ++i)
                    {
                        if (options[i].first == "out")
                        {
                            file_name = options[i].second;
                        }
                        else
                        {
                            *error = "unsupported options: " + options[i].first;
                            return false;
                        }
                    }

                    if (file_name.empty())
                    {
                        file_name = StripProto(file->name()) + ".grpc.js";
                    }

                    std::map<string, string> vars;
                    string package = file->package();
                    if (package.empty())
                    {
                        package = Basename(StripProto(file->name()), '/');
                    }
                    vars["client_name"] = UppercaseFirstLetter(Basename(StripProto(file->name()), '/'));
                    vars["package"] = package;
                    vars["package_dot"] = package.empty() ? "" : package + '.';

                    std::unique_ptr<ZeroCopyOutputStream> output(
                        context->Open(file_name));
                    Printer printer(output.get(), '$');
                    PrintFileHeader(&printer, vars);
                    printer.Print(vars, "goog.module('proto.$package$.$client_name$Client');\n\n");

                    printer.Print(vars, "const GrpcApi = goog.require('grpc.Api');\n");
                    printer.Print(vars, "const GrpcEndpoint = goog.require('grpc.Endpoint');\n");
                    printer.Print(vars, "const GrpcOptions = goog.require('grpc.Options');\n");
                    printer.Print(vars, "const GrpcRejection = goog.require('grpc.Rejection');\n");
                    printer.Print(vars, "const GrpcStatus = goog.require('grpc.Status');\n");
                    printer.Print(vars, "const GoogPromise = goog.require('goog.Promise');\n");
                    printer.Print(vars, "const Observer = goog.require('grpc.Observer');\n");
                    printer.Print(vars, "const Transport = goog.require('grpc.Transport');\n");
                    printer.Print(vars, "const UnaryCallObserver = goog.require('grpc.stream.observer.UnaryCallObserver');\n\n");
                    printer.Print(vars, "const StreamingCallObserver = goog.require('grpc.stream.observer.StreamingCallObserver');\n\n");

                    PrintMessagesDeps(&printer, file);

                    for (int service_index = 0;
                         service_index < file->service_count();
                         ++service_index)
                    {
                        const ServiceDescriptor *service = file->service(service_index);
                        vars["service_name"] = service->name();
                        PrintServiceClass(&printer, vars);
                        printer.Indent();
                        PrintServiceConstructor(&printer, vars);

                        for (int method_index = 0;
                             method_index < service->method_count();
                             ++method_index)
                        {
                            const MethodDescriptor *method = service->method(method_index);
                            vars["js_method_name"] = LowercaseFirstLetter(method->name());
                            vars["method_name"] = method->name();
                            vars["in"] = CamelName(method->input_type()->full_name(), '.');
                            vars["out"] = CamelName(method->output_type()->full_name(), '.');

                            if (method->client_streaming())
                            {
                                if (method->server_streaming())
                                {
                                    PrintBidiStreamingCall(&printer, vars);
                                }
                                else
                                {
                                    PrintClientStreamingCall(&printer, vars);
                                }
                            }
                            else
                            {
                                if (method->server_streaming())
                                {
                                    PrintServerStreamingCall(&printer, vars);
                                }
                                else
                                {
                                    PrintUnaryCall(&printer, vars);
                                }
                            }
                        }
                        printer.Outdent();
                        printer.Print("} // service class\n\n");
                    }

                    PrintApiClass(&printer, vars);
                    printer.Indent();

                    printer.Print(
                        vars,
                        "/**\n"
                        " * @param {?GrpcOptions=} opt_options\n"
                        " * @param {?Transport=} opt_transport\n"
                        " */\n"
                        "constructor(opt_options, opt_transport) {\n");
                    printer.Indent();
                    printer.Print("super(opt_options, opt_transport);\n");
                    for (int i = 0; i < file->service_count(); ++i)
                    {
                        const ServiceDescriptor *service = file->service(i);
                        vars["service_name"] = service->name();
                        printer.Print(
                            vars,
                            "/** @const @private @type {!$service_name$} */\n"
                            "this.$service_name$_ = new $service_name$(this);\n");
                    }
                    printer.Outdent();
                    printer.Print("} // constructor\n\n");

                    for (int i = 0; i < file->service_count(); ++i)
                    {
                        const ServiceDescriptor *service = file->service(i);
                        vars["service_name"] = service->name();
                        PrintServiceGetter(&printer, vars);
                    }

                    printer.Outdent();
                    printer.Print("}\n\n");
                    printer.Print(vars, "exports = $client_name$Client;\n\n");

                    return true;
                }
            };

        } // namespace
    }     // namespace js
} // namespace grpc

int main(int argc, char *argv[])
{
    grpc::js::GrpcCodeGenerator generator;
    PluginMain(argc, argv, &generator);
    return 0;
}