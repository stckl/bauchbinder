{
  "targets": [
    {
      "target_name": "decklink_output",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "sources": ["decklink_output.cpp"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "sdk"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='mac'", {
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15"
          },
          "link_settings": {
            "libraries": [
              "-framework CoreFoundation"
            ]
          },
          "sources": ["sdk/DeckLinkAPIDispatch.cpp"]
        }],
        ["OS=='win'", {
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          },
          "libraries": [
            "-lole32",
            "-loleaut32",
            "-lcomsuppw"
          ],
          "sources": ["sdk/DeckLinkAPI_i.c"]
        }]
      ]
    }
  ]
}
