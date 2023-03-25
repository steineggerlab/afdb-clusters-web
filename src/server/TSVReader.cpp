#include <napi.h>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>

using namespace Napi;

class TSVReader : public Napi::ObjectWrap<TSVReader> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    TSVReader(const Napi::CallbackInfo& info);
private:
    static Napi::FunctionReference constructor;
    std::vector<std::string> keys;
    std::vector<uint32_t> offsets;
    std::vector<uint32_t> lengths;
    void readFile(const std::string& filename);
    Napi::Value ReadFile(const Napi::CallbackInfo& info);
    Napi::Value GetKey(const Napi::CallbackInfo& info);
    Napi::Value GetOffset(const Napi::CallbackInfo& info);
    Napi::Value GetLength(const Napi::CallbackInfo& info);
    Napi::Value Size(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, this->keys.size());
    }
};

Napi::FunctionReference TSVReader::constructor;

Napi::Object TSVReader::Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "TSVReader", {
        InstanceMethod("readFile", &TSVReader::ReadFile),
        InstanceMethod("getKey", &TSVReader::GetKey),
        InstanceMethod("getOffset", &TSVReader::GetOffset),
        InstanceMethod("getLength", &TSVReader::GetLength),
        InstanceMethod("getSize", &TSVReader::Size)
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("TSVReader", func);
    return exports;
}

TSVReader::TSVReader(const Napi::CallbackInfo& info) : Napi::ObjectWrap<TSVReader>(info) {}

void TSVReader::readFile(const std::string& filename) {
    std::ifstream inFile(filename);
    std::string line;
    while (std::getline(inFile, line)) {
        std::istringstream ss(line);
        std::string key;
        uint32_t offset, length;
        if (ss >> key >> offset >> length) {
            keys.push_back(key);
            offsets.push_back(offset);
            lengths.push_back(length);
        }
    }
}

Napi::Value TSVReader::ReadFile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        TypeError::New(env, "Expected a file path").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filename = info[0].As<Napi::String>().Utf8Value();
    readFile(filename);

    return env.Undefined();
}

Napi::Value TSVReader::GetKey(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        TypeError::New(env, "Expected an index").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t index = info[0].As<Napi::Number>().Uint32Value();
    if (index >= keys.size()) {
        RangeError::New(env, "Index out of range").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::String::New(env, keys[index]);
}

Napi::Value TSVReader::GetOffset(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        TypeError::New(env, "Expected an index").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t index = info[0].As<Napi::Number>().Uint32Value();
    if (index >= offsets.size()) {
        RangeError::New(env, "Index out of range").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Number::New(env, offsets[index]);
}

Napi::Value TSVReader::GetLength(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        TypeError::New(env, "Expected an index").ThrowAsJavaScriptException();
        return env.Null();
    }

    uint32_t index = info[0].As<Napi::Number>().Uint32Value();
    if (index >= lengths.size()) {
        RangeError::New(env, "Index out of range").ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Number::New(env, lengths[index]);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  TSVReader::Init(env, exports);
  return exports;
}
NODE_API_MODULE(tsvreader, Init)