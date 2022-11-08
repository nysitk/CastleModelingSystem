export function gradientDescentCameraParameter() {

    // shimabara
    const cameraPos = {
        "x": 200, //ans:241.72459748046273,
        "y": 72.8499912883189,
        "z": 387.9337030430132
    }

    const orbitTarget = {
        "x": 0.92,
        "y": 104.4,
        "z": 1.0
    }

    const cameraPersp = this.sceneManager.cameraPersp
    const orbit = this.sceneManager.orbit

    // const cameraPos = cameraPersp.position
    // const orbitTarget = orbit.target

    const calcError = () => this.calcError("num")

    const alpha = 0.0001;
    const th = 300;

    let i = 0;
    let loopFlag = true;
    let prevError, nowError;
    const prevPos = new THREE.Vector3();
    const prevTarget = new THREE.Vector3();
    const difference = new THREE.Vector3();
    let min = Infinity

    const fn = function () {

        // カメラ位置の変更
        cameraPersp.position.set(
            cameraPos.x,
            cameraPos.y,
            cameraPos.z
        );

        // orbitの注視点の変更
        orbit.target.set(
            orbitTarget.x,
            orbitTarget.y,
            orbitTarget.z
        );
    
        cameraPersp.updateProjectionMatrix();
        orbit.update();

        // console.log(cameraPos.x, prevPos.x, nowError, prevError)
        nowError = calcError()

        if (i == 0) {
            prevError = nowError;

            prevPos.x = cameraPos.x;
            cameraPos.x += 0.001;

            // prevPos.y = cameraPos.y;
            // cameraPos.y += 0.001;

            // prevPos.z = cameraPos.z;
            // cameraPos.z += 0.001;

            // prevTarget.x = orbitTarget.x;
            // orbitTarget.x += 0.001;

            // prevTarget.y = orbitTarget.y;
            // orbitTarget.y += 0.001;

            // prevTarget.z = orbitTarget.z;
            // orbitTarget.z += 0.001;

            // カメラ位置の変更
            cameraPersp.position.set(
                cameraPos.x,
                cameraPos.y,
                cameraPos.z
            );
    
            // orbitの注視点の変更
            orbit.target.set(
                orbitTarget.x,
                orbitTarget.y,
                orbitTarget.z
            );
    
            cameraPersp.updateProjectionMatrix();
            orbit.update();

            nowError = calcError();
            
            i++;
            return;
        }

        if ( -th < difference && difference < th) loopFlag = false;
        if (nowError < th) loopFlag = false;

        if (nowError < min) min = nowError;

        console.log("cameraPos.x: " + cameraPos.x + " cameraPos.y: " + cameraPos.y + " cameraPos.z: " + cameraPos.z + ", ErrorNum: " + nowError)
        console.log("orbitTarget.x: " + orbitTarget.x + " orbitTarget.y: " + orbitTarget.y + " orbitTarget.z: " + orbitTarget.z + ", ErrorNum: " + nowError)

        difference.x = (nowError - prevError) / (cameraPos.x - prevPos.x);
        prevPos.x = cameraPos.x;
        cameraPos.x -= alpha * difference.x;
        if (cameraPos.x == prevPos.x) cameraPos.x += 0.1;

        // difference.y = (nowError - prevError) / (cameraPos.y - prevPos.y);
        // prevPos.y = cameraPos.y;
        // cameraPos.y -= alpha * difference.y;
        // if (cameraPos.y == prevPos.y) cameraPos.y += 0.1;

        // difference.z = (nowError - prevError) / (cameraPos.z - prevPos.z);
        // prevPos.z = cameraPos.z;
        // cameraPos.z -= alpha * difference.z;
        // if (cameraPos.z == prevPos.z) cameraPos.z += 0.1;

        // difference.x = (nowError - prevError) / (orbitTarget.x - prevTarget.x);
        // prevTarget.x = orbitTarget.x;
        // orbitTarget.x -= alpha * difference.x;
        // if (orbitTarget.x == prevTarget.x) orbitTarget.x += 0.1;

        // difference.y = (nowError - prevError) / (orbitTarget.y - prevTarget.y);
        // prevTarget.y = orbitTarget.y;
        // orbitTarget.y -= alpha * difference.y;
        // if (orbitTarget.y == prevTarget.y) orbitTarget.y += 0.1;

        // difference.z = (nowError - prevError) / (orbitTarget.z - prevTarget.z);
        // prevTarget.z = orbitTarget.z;
        // orbitTarget.z -= alpha * difference.z;
        // if (orbitTarget.z == prevTarget.z) orbitTarget.z += 0.1;

        // console.log(cameraPos, orbitTarget, nowError, min)

        prevError = nowError;

        if (i > 1000 || !loopFlag) clearInterval(id)
        i++;

    }

    const id = setInterval(fn, 0)

}

export function gradientDescentPrototype() {
    const alpha = 0.0001;
    const initX = 100;
    const th = 0.0000000001;
    const dx = 0.0001;
    const a = 1.00;
    const b = 2.00;
    const c = 3.00;

    function f(x) {
        return a*x*x + b*x + c;
    }

    function diff(x) {
        return ( f(x+dx) - f(x-dx) ) / (2.0*dx);
    }

    let x = initX;
    let loopFlag = true;
    let difference;

    console.log(x, f(x));

    while(loopFlag) {
        difference = diff(x);
        x -= alpha * difference;
        if ( -th < difference && difference < th) loopFlag = false;
        console.log(x, f(x));
    }

    console.log("x: " + x + " extremum: " + f(x));
}

export function gradientDescentPrototype2() {
    const alpha = 0.0001;
    const initX = 10;
    const th = 0.0000000001;
    const dx = 0.0001;
    const a = 1.00;
    const b = 2.00;
    const c = 3.00;

    function f(x) {
        return a*x*x + b*x + c;
    }

    function diff(x) {
        return ( f(x+dx) - f(x-dx) ) / (2.0*dx);
    }

    let x = initX;
    let loopFlag = true;
    let difference;

    let now, prev, prevX;
    let i = 0;

    console.log(x, f(x));

    while(loopFlag) {
        now = f(x)

        if (i == 0) {
            prev = now;
            prevX = x;
            x += 0.1;
            now = f(x);
            i++;
            continue;
        }

        difference = (now - prev) / (x - prevX);
        prevX = x;
        x -= difference* alpha;
        if ( -th < difference && difference < th) loopFlag = false;
        console.log(x, f(x));
        prev = now;

        i++
    }

    console.log("x: " + x + " extremum: " + f(x));
}

export function getPixelBuffer(renderTarget, width, height) {

    const pixelBuffer = new Uint8Array( width * height * 4 );
    this.sceneManager.renderer.readRenderTargetPixels( renderTarget, 0, 0, width, height, pixelBuffer );

    return pixelBuffer;
}

export function changeBufferToJson(pixelBuffer, width, height) {
    const imageArray = new Array();

    for (let y = height - 1; y >= 0; y--) {

        for (let x = 0; x < width; x++) {

            let p = getPixel(pixelBuffer, x, y, width, height);
            imageArray.push(p);

        }

    }

    return imageArray;

    function getPixel(pixels, x, y, width, height) {
        const pos = x + y * width;
        const head = pos * 4;

        const r = pixels[head] * 255;
        const g = pixels[head+1] * 255;
        const b = pixels[head+2] * 255;
        const a = pixels[head+3] * 255;

        return {r, g, b, a}

    }
}

export function adjustArrayDirection(pixelBuffer, width, height) {
    const imageArray = new Array();

    for (let y = height - 1; y >= 0; y--) {

        for (let x = 0; x < width; x++) {

            const pos = x + y * width;
            const head = pos * 4;

            imageArray.push(pixelBuffer[head]);
            imageArray.push(pixelBuffer[head+1]);
            imageArray.push(pixelBuffer[head+2]);
            imageArray.push(pixelBuffer[head+3]);

        }

    }

    return imageArray;

}

export function generatePixelData(type = "buffer") {

    const renderTarget = this.sceneManager.renderTarget
    this.sceneManager.renderer.setRenderTarget( renderTarget );
    this.sceneManager.renderer.render( this.sceneManager.scene, this.sceneManager.currentCamera );

    let width = renderTarget.width;
    let height = renderTarget.height;

    const pixelBuffer = this.getPixelBuffer(renderTarget, width, height)
    const adjustPixelBuffer = this.adjustArrayDirection(pixelBuffer, width, height);
    let buffer = Array.from(adjustPixelBuffer);

    if (type == "buffer")
        return {
            width: width,
            height: height,
            buffer: buffer
        }

    const imageArray = this.changeBufferToJson(pixelBuffer, width, height);
    
    return {
        width: width,
        height: height,
        array: imageArray
    }

}

export function downloadFile(rawData, fileName) {
    const data = JSON.stringify(rawData);
    const link = document.createElement("a");
    link.href = "data:text/plain," + encodeURIComponent(data);
    link.download = fileName;
    link.click();
}

export function calcError(type = "json") {

    const rawData = this.generatePixelData("buffer");
    
    const canvas = document.getElementById("backgroundCanvas");
    const context = canvas.getContext("2d");

    const editorBuffer = rawData.buffer;
    const imageBuffer = context.getImageData(0, 0, canvas.width, canvas.height).data

    const errorBuffer = new Array();
    let errorNum = 0;

    if (editorBuffer.length != imageBuffer.length) {
        console.error("These canvases are not the same size.")
        return;
    }

    for (let i = 0; i < editorBuffer.length; i++) {
        let error = (editorBuffer[i] != imageBuffer[i]);

        if (type == "json") {
            let pix = (editorBuffer[i] - imageBuffer[i] + 255) / 2
            errorBuffer.push(pix)
        }

        if (error) errorNum++;
    }

    const errorRate = errorNum / editorBuffer.length;
    
    if (type == "json") {
        return {
            width: rawData.width,
            height: rawData.height,
            errorRate: errorRate,
            buffer: errorBuffer
        }
    } else if (type == "num") {
        return errorNum
    } else {
        return errorRate
    }

}