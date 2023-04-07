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
    std::vector<uint64_t> offsets;
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
    class ReadFileWorker : public Napi::AsyncWorker {
    public:
        ReadFileWorker(Napi::Function& callback, const std::string& filename, TSVReader* reader)
            : Napi::AsyncWorker(callback), filename(filename), reader(reader)
        {}

        void Execute() override {
            reader->readFile(filename);
        }

        void OnOK() override {
            // Call the callback function with no arguments
            Napi::HandleScope scope(Env());
            Callback().Call({});
        }

    private:
        std::string filename;
        TSVReader* reader;
    };
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
    FILE* handle = fopen(filename.c_str(), "r");
    char line[1024];
    while (fgets(line, 1024, handle) != nullptr) {
        char* pos = line;

        // extract key
        char* end_pos = strchr(pos, '\t');
        if (end_pos != nullptr) {
            keys.emplace_back(pos, end_pos - pos);
            pos = end_pos + 1;
        }

        // extract offset
        end_pos = strchr(pos, '\t');
        if (end_pos != nullptr) {
            std::string offset = std::string(pos, end_pos - pos);
            offsets.emplace_back(std::strtoull(offset.c_str(), NULL, 10));
            pos = end_pos + 1;
        }

        // extract length
        if (pos != nullptr && pos[0] != '\0') {
            std::string length = std::string(pos, strchr(pos, '\n') - pos);
            uint32_t length_int = std::strtoul(length.c_str(), NULL, 10);
            lengths.emplace_back(length_int);
        }
    }
    fclose(handle);
}

Napi::Value TSVReader::ReadFile(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    // Check the number of arguments
    if (info.Length() < 1 || info.Length() > 2 || !info[0].IsString() ||
        (info.Length() == 2 && !info[1].IsFunction())) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    // Get the filename argument and the callback function (if present)
    std::string filename = info[0].ToString().Utf8Value();
    Napi::Function callback = info.Length() == 2 ? info[1].As<Napi::Function>() : Napi::Function::New(env, [](const Napi::CallbackInfo&){});

    // Create a ReadFileWorker instance to perform the file reading asynchronously
    ReadFileWorker* worker = new ReadFileWorker(callback, filename, this);
    worker->Queue();

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
