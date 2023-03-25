{
    "targets": [
        {
            "target_name": "tsvreader",
            "sources": [
                "src/server/TSVReader.cpp"
            ],
            "include_dirs": [
                "<!(node -p \"require('node-addon-api').include\")",
                "<!(node -p \"path.resolve('node_modules/node-addon-api')\")"
            ],
            "libraries": [],
            "defines": [
                "NAPI_DISABLE_CPP_EXCEPTIONS"
            ],
            "cflags!": [
                "-fno-exceptions"
            ],
            "cflags_cc!": [
                "-fno-exceptions"
            ]
        }
    ]
}

