export const FovEstimationPresets = {
    "shimabaraPresetModel": {
        "rectAspect": 1.0,
        "rectWidth": 85 * 2,
        "initFov": 60,
        "yaguraSteps": 5,
        "planeEstimation": [
            {
                "x": 89,
                "y": 569
            },
            {
                "x": 489,
                "y": 621
            },
            {
                "x": 671,
                "y": 548
            },
            {
                "x": 335,
                "y": 513
            }
        ],
        "combine": true,
        "2DFix": [
            null,
            null,
            {
                "x": 626,
                "y": 461
            },
            {
                "x": 466,
                "y": 127
            }
        ],
        "target": [
            {
                "type": "yaneTop",
                "x": 428,
                "y": 104
            },
            {
                "type": "yaguraTop",
                "x": 415,
                "y": 106
            }
        ]
    },
    "shimabara2": {
        "rectAspect": 0.85,
        "rectWidth": 85 * 2,
        "yaguraSteps": 5,
        "planeEstimation": [
            {
                "x": 190,
                "y": 831
            },
            {
                "x": 567,
                "y": 877
            },
            {
                "x": 1177,
                "y": 822
            },
            {
                "x": 702,
                "y": 808
            }
        ],
        "combine": true,
        "2DFix": [
            null,
            null,
            {
                "x": 1072,
                "y": 683
            },
            {
                "x": 776,
                "y": 216
            }
        ],
        "target": [
            {
                "type": "yaneTop",
                "x": 643,
                "y": 116
            }
        ]
    },
}