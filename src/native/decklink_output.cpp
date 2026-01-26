/**
 * DeckLink Output - Native Node.js Addon
 * Minimal implementation for Key/Fill video output via Blackmagic DeckLink
 */

#include <napi.h>
#include <string>
#include <vector>
#include <mutex>
#include <atomic>

#ifdef _WIN32
#include <comdef.h>
#endif

#include "DeckLinkAPI.h"

// Platform-specific initialization
#ifdef _WIN32
static bool g_comInitialized = false;
#endif

// ============================================================================
// Helper: Convert DeckLink string to std::string
// ============================================================================
#ifdef _WIN32
std::string BStrToString(BSTR bstr) {
    if (!bstr) return "";
    int len = WideCharToMultiByte(CP_UTF8, 0, bstr, -1, nullptr, 0, nullptr, nullptr);
    std::string result(len - 1, 0);
    WideCharToMultiByte(CP_UTF8, 0, bstr, -1, &result[0], len, nullptr, nullptr);
    return result;
}
#define DLString BSTR
#define FreeDLString(s) SysFreeString(s)
#define DLStringToStd(s) BStrToString(s)
#else
#define DLString CFStringRef
#define FreeDLString(s) CFRelease(s)
std::string CFStringToString(CFStringRef cfStr) {
    if (!cfStr) return "";
    CFIndex length = CFStringGetLength(cfStr);
    CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8) + 1;
    std::string result(maxSize, 0);
    CFStringGetCString(cfStr, &result[0], maxSize, kCFStringEncodingUTF8);
    result.resize(strlen(result.c_str()));
    return result;
}
#define DLStringToStd(s) CFStringToString(s)
#endif

// ============================================================================
// Output Instance - manages a single DeckLink output
// ============================================================================
class DeckLinkOutputInstance {
public:
    IDeckLink* device = nullptr;
    IDeckLinkOutput* output = nullptr;
    IDeckLinkConfiguration* config = nullptr;
    IDeckLinkKeyer* keyer = nullptr;
    IDeckLinkMutableVideoFrame* frame = nullptr;

    int width = 1920;
    int height = 1080;
    BMDDisplayMode displayMode = bmdModeHD1080p50;
    BMDPixelFormat pixelFormat = bmdFormat8BitBGRA;
    BMDTimeValue frameDuration = 1000;
    BMDTimeScale timeScale = 50000;

    bool enableKeyer = false;  // External keyer mode (Key/Fill on single device)
    std::atomic<bool> running{false};
    std::atomic<int64_t> frameCount{0};
    std::mutex frameMutex;

    ~DeckLinkOutputInstance() {
        Stop();
        if (frame) frame->Release();
        if (keyer) keyer->Release();
        if (config) config->Release();
        if (output) output->Release();
        if (device) device->Release();
    }

    bool Start() {
        if (running || !output) return false;

        HRESULT result;

        // Enable external keyer if requested
        if (enableKeyer && keyer) {
            // Enable external keying - this routes Fill to SDI Out 1, Key to SDI Out 2
            result = keyer->Enable(true);  // true = external keying
            if (result != S_OK) {
                // Non-fatal: some devices might not support keying
            }
            // Set keyer level to 100% (full alpha)
            keyer->SetLevel(255);
        }

        // Enable video output
        result = output->EnableVideoOutput(displayMode, bmdVideoOutputFlagDefault);
        if (result != S_OK) {
            return false;
        }

        // Create video frame
        result = output->CreateVideoFrame(
            width, height,
            width * 4,  // rowBytes for BGRA
            pixelFormat,
            bmdFrameFlagDefault,
            &frame
        );
        if (result != S_OK) {
            output->DisableVideoOutput();
            return false;
        }

        // Clear frame to transparent black
        void* frameBytes;
        frame->GetBytes(&frameBytes);
        memset(frameBytes, 0, width * height * 4);

        // Start scheduled playback
        result = output->StartScheduledPlayback(0, timeScale, 1.0);
        if (result != S_OK) {
            frame->Release();
            frame = nullptr;
            output->DisableVideoOutput();
            return false;
        }

        running = true;
        frameCount = 0;
        return true;
    }

    void Stop() {
        if (!running) return;

        running = false;

        if (output) {
            output->StopScheduledPlayback(0, nullptr, 0);
            output->DisableVideoOutput();
        }

        // Disable keyer
        if (enableKeyer && keyer) {
            keyer->Disable();
        }

        if (frame) {
            frame->Release();
            frame = nullptr;
        }

        frameCount = 0;
    }

    bool ScheduleFrame(const uint8_t* data, size_t size) {
        if (!running || !frame || !output) return false;

        std::lock_guard<std::mutex> lock(frameMutex);

        void* frameBytes;
        frame->GetBytes(&frameBytes);

        size_t expectedSize = width * height * 4;
        if (size >= expectedSize) {
            memcpy(frameBytes, data, expectedSize);
        }

        int64_t fc = frameCount++;
        HRESULT result = output->ScheduleVideoFrame(
            frame,
            fc * frameDuration,
            frameDuration,
            timeScale
        );

        return result == S_OK;
    }
};

// Global storage for output instances
static std::vector<DeckLinkOutputInstance*> g_outputs;
static std::mutex g_outputsMutex;

// ============================================================================
// Initialize - Platform setup
// ============================================================================
Napi::Value Initialize(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

#ifdef _WIN32
    if (!g_comInitialized) {
        HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
        if (SUCCEEDED(hr)) {
            g_comInitialized = true;
        } else {
            Napi::Error::New(env, "Failed to initialize COM").ThrowAsJavaScriptException();
            return env.Null();
        }
    }
#endif

    return Napi::Boolean::New(env, true);
}

// ============================================================================
// GetDevices - Enumerate available DeckLink devices
// ============================================================================
Napi::Value GetDevices(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array result = Napi::Array::New(env);

    IDeckLinkIterator* iterator = CreateDeckLinkIteratorInstance();
    if (!iterator) {
        // DeckLink drivers not installed
        return result;
    }

    IDeckLink* device;
    uint32_t index = 0;

    while (iterator->Next(&device) == S_OK) {
        DLString displayName = nullptr;
        DLString modelName = nullptr;

        device->GetDisplayName(&displayName);
        device->GetModelName(&modelName);

        Napi::Object deviceObj = Napi::Object::New(env);
        deviceObj.Set("index", Napi::Number::New(env, index));
        deviceObj.Set("displayName", Napi::String::New(env, displayName ? DLStringToStd(displayName) : "Unknown"));
        deviceObj.Set("modelName", Napi::String::New(env, modelName ? DLStringToStd(modelName) : "Unknown"));

        // Check capabilities
        IDeckLinkOutput* output = nullptr;
        bool hasOutput = device->QueryInterface(IID_IDeckLinkOutput, (void**)&output) == S_OK;
        deviceObj.Set("supportsOutput", Napi::Boolean::New(env, hasOutput));
        if (output) output->Release();

        // Check for keyer support (needed for Key/Fill on single device like UltraStudio)
        IDeckLinkKeyer* keyer = nullptr;
        bool hasKeyer = device->QueryInterface(IID_IDeckLinkKeyer, (void**)&keyer) == S_OK;
        deviceObj.Set("supportsKeyer", Napi::Boolean::New(env, hasKeyer));
        if (keyer) keyer->Release();

        if (displayName) FreeDLString(displayName);
        if (modelName) FreeDLString(modelName);

        result.Set(index, deviceObj);
        device->Release();
        index++;
    }

    iterator->Release();
    return result;
}

// ============================================================================
// GetDisplayModes - Get supported display modes
// ============================================================================
Napi::Value GetDisplayModes(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    Napi::Array result = Napi::Array::New(env);

    // Common HD modes
    struct ModeInfo {
        BMDDisplayMode mode;
        const char* name;
        int width;
        int height;
        double frameRate;
    };

    ModeInfo modes[] = {
        {bmdModeHD1080p50, "1080p50", 1920, 1080, 50.0},
        {bmdModeHD1080p5994, "1080p59.94", 1920, 1080, 59.94},
        {bmdModeHD1080p60, "1080p60", 1920, 1080, 60.0},
        {bmdModeHD1080i50, "1080i50", 1920, 1080, 25.0},
        {bmdModeHD1080i5994, "1080i59.94", 1920, 1080, 29.97},
        {bmdModeHD720p50, "720p50", 1280, 720, 50.0},
        {bmdModeHD720p60, "720p60", 1280, 720, 60.0},
    };

    for (size_t i = 0; i < sizeof(modes)/sizeof(modes[0]); i++) {
        Napi::Object modeObj = Napi::Object::New(env);
        modeObj.Set("id", Napi::Number::New(env, modes[i].mode));
        modeObj.Set("name", Napi::String::New(env, modes[i].name));
        modeObj.Set("width", Napi::Number::New(env, modes[i].width));
        modeObj.Set("height", Napi::Number::New(env, modes[i].height));
        modeObj.Set("frameRate", Napi::Number::New(env, modes[i].frameRate));
        result.Set((uint32_t)i, modeObj);
    }

    return result;
}

// ============================================================================
// CreateOutput - Create an output instance for a device
// ============================================================================
Napi::Value CreateOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Device index required").ThrowAsJavaScriptException();
        return env.Null();
    }

    int deviceIndex = info[0].As<Napi::Number>().Int32Value();

    // Optional: display mode and keyer
    BMDDisplayMode displayMode = bmdModeHD1080p50;
    int width = 1920;
    int height = 1080;
    BMDTimeValue frameDuration = 1000;
    BMDTimeScale timeScale = 50000;
    bool enableKeyer = false;

    if (info.Length() > 1 && info[1].IsObject()) {
        Napi::Object options = info[1].As<Napi::Object>();
        if (options.Has("displayMode")) {
            displayMode = (BMDDisplayMode)options.Get("displayMode").As<Napi::Number>().Int64Value();
        }
        if (options.Has("width")) {
            width = options.Get("width").As<Napi::Number>().Int32Value();
        }
        if (options.Has("height")) {
            height = options.Get("height").As<Napi::Number>().Int32Value();
        }
        if (options.Has("frameRate")) {
            double fps = options.Get("frameRate").As<Napi::Number>().DoubleValue();
            timeScale = (BMDTimeScale)(fps * 1000);
            frameDuration = 1000;
        }
        if (options.Has("enableKeyer")) {
            enableKeyer = options.Get("enableKeyer").As<Napi::Boolean>().Value();
        }
    }

    // Find device
    IDeckLinkIterator* iterator = CreateDeckLinkIteratorInstance();
    if (!iterator) {
        Napi::Error::New(env, "DeckLink drivers not installed").ThrowAsJavaScriptException();
        return env.Null();
    }

    IDeckLink* device = nullptr;
    int currentIndex = 0;
    while (iterator->Next(&device) == S_OK) {
        if (currentIndex == deviceIndex) {
            break;
        }
        device->Release();
        device = nullptr;
        currentIndex++;
    }
    iterator->Release();

    if (!device) {
        Napi::Error::New(env, "Device not found").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get output interface
    IDeckLinkOutput* output = nullptr;
    if (device->QueryInterface(IID_IDeckLinkOutput, (void**)&output) != S_OK) {
        device->Release();
        Napi::Error::New(env, "Device does not support output").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Get configuration interface (optional)
    IDeckLinkConfiguration* config = nullptr;
    device->QueryInterface(IID_IDeckLinkConfiguration, (void**)&config);

    // Get keyer interface (optional, for Key/Fill on single device)
    IDeckLinkKeyer* keyer = nullptr;
    if (enableKeyer) {
        if (device->QueryInterface(IID_IDeckLinkKeyer, (void**)&keyer) != S_OK) {
            output->Release();
            if (config) config->Release();
            device->Release();
            Napi::Error::New(env, "Device does not support keying").ThrowAsJavaScriptException();
            return env.Null();
        }
    }

    // Create instance
    DeckLinkOutputInstance* instance = new DeckLinkOutputInstance();
    instance->device = device;
    instance->output = output;
    instance->config = config;
    instance->keyer = keyer;
    instance->enableKeyer = enableKeyer;
    instance->displayMode = displayMode;
    instance->width = width;
    instance->height = height;
    instance->frameDuration = frameDuration;
    instance->timeScale = timeScale;

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    int outputId = (int)g_outputs.size();
    g_outputs.push_back(instance);

    return Napi::Number::New(env, outputId);
}

// ============================================================================
// StartOutput - Start playback on an output
// ============================================================================
Napi::Value StartOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Output ID required").ThrowAsJavaScriptException();
        return env.Null();
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        Napi::Error::New(env, "Invalid output ID").ThrowAsJavaScriptException();
        return env.Null();
    }

    bool success = g_outputs[outputId]->Start();
    return Napi::Boolean::New(env, success);
}

// ============================================================================
// StopOutput - Stop playback on an output
// ============================================================================
Napi::Value StopOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Output ID required").ThrowAsJavaScriptException();
        return env.Null();
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        Napi::Error::New(env, "Invalid output ID").ThrowAsJavaScriptException();
        return env.Null();
    }

    g_outputs[outputId]->Stop();
    return Napi::Boolean::New(env, true);
}

// ============================================================================
// DestroyOutput - Release an output instance
// ============================================================================
Napi::Value DestroyOutput(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Output ID required").ThrowAsJavaScriptException();
        return env.Null();
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        return Napi::Boolean::New(env, false);
    }

    delete g_outputs[outputId];
    g_outputs[outputId] = nullptr;
    return Napi::Boolean::New(env, true);
}

// ============================================================================
// ScheduleFrame - Schedule a video frame for output
// ============================================================================
Napi::Value ScheduleFrame(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsBuffer()) {
        Napi::TypeError::New(env, "Output ID and Buffer required").ThrowAsJavaScriptException();
        return env.Null();
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();
    Napi::Buffer<uint8_t> buffer = info[1].As<Napi::Buffer<uint8_t>>();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        Napi::Error::New(env, "Invalid output ID").ThrowAsJavaScriptException();
        return env.Null();
    }

    bool success = g_outputs[outputId]->ScheduleFrame(buffer.Data(), buffer.Length());
    return Napi::Boolean::New(env, success);
}

// ============================================================================
// IsRunning - Check if output is running
// ============================================================================
Napi::Value IsRunning(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        return Napi::Boolean::New(env, false);
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        return Napi::Boolean::New(env, false);
    }

    return Napi::Boolean::New(env, g_outputs[outputId]->running.load());
}

// ============================================================================
// GetFrameCount - Get scheduled frame count
// ============================================================================
Napi::Value GetFrameCount(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        return Napi::Number::New(env, 0);
    }

    int outputId = info[0].As<Napi::Number>().Int32Value();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    if (outputId < 0 || outputId >= (int)g_outputs.size() || !g_outputs[outputId]) {
        return Napi::Number::New(env, 0);
    }

    return Napi::Number::New(env, (double)g_outputs[outputId]->frameCount.load());
}

// ============================================================================
// Cleanup - Release all resources
// ============================================================================
Napi::Value Cleanup(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    std::lock_guard<std::mutex> lock(g_outputsMutex);
    for (auto& output : g_outputs) {
        if (output) {
            delete output;
        }
    }
    g_outputs.clear();

#ifdef _WIN32
    if (g_comInitialized) {
        CoUninitialize();
        g_comInitialized = false;
    }
#endif

    return Napi::Boolean::New(env, true);
}

// ============================================================================
// Module initialization
// ============================================================================
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("initialize", Napi::Function::New(env, Initialize));
    exports.Set("getDevices", Napi::Function::New(env, GetDevices));
    exports.Set("getDisplayModes", Napi::Function::New(env, GetDisplayModes));
    exports.Set("createOutput", Napi::Function::New(env, CreateOutput));
    exports.Set("startOutput", Napi::Function::New(env, StartOutput));
    exports.Set("stopOutput", Napi::Function::New(env, StopOutput));
    exports.Set("destroyOutput", Napi::Function::New(env, DestroyOutput));
    exports.Set("scheduleFrame", Napi::Function::New(env, ScheduleFrame));
    exports.Set("isRunning", Napi::Function::New(env, IsRunning));
    exports.Set("getFrameCount", Napi::Function::New(env, GetFrameCount));
    exports.Set("cleanup", Napi::Function::New(env, Cleanup));
    return exports;
}

NODE_API_MODULE(decklink_output, Init)
