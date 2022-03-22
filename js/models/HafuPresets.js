export const HafuPresets = {
	example: [
		{
			layer: 1,
			dir: 0,
			center: 1/2,
			widthrate: 1/2,
			heightrate: 2,
			depthrate: 1
		},
	],
	osaka: [
		{
			layer: 0,
			dir: 0,
			center: 1/4,
			widthrate: 1/4,
			heightrate: 3/2,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 0,
			dir: 0,
			center: 3/4,
			widthrate: 1/4,
			heightrate: 3/2,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 1,
			dir: 0,
			center: 1/2,
			widthrate: 1/2,
			heightrate: 7/3,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 3,
			dir: 0,
			center: 1/2,
			widthrate: 1/2,
			heightrate: 3/2,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 0,
			dir: 1,
			center: 1/2,
			widthrate: 1,
			heightrate: 8/3,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 2,
			dir: 1,
			center: 1/2,
			widthrate: 1,
			heightrate: 8/3,
			depthrate: 1,
			symmetric: true
		},
	],
	matsumoto: [
		{
			layer: 1,
			dir: 1,
			center: 1/2,
			widthrate: 1/2,
			heightrate: 3/2,
			depthrate: 1,
			symmetric: true
		},
		{
			layer: 2,
			dir: 0,
			center: 1/2,
			widthrate: 1/2,
			heightrate: 3/2,
			depthrate: 1,
			symmetric: true
		},
	]
}