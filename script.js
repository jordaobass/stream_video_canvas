const btn = document.getElementById("btn");
const out = document.getElementById("out");

async function getOverlayedVideoStreams(stream1, stream2) {
  // cria os player
  const vid1 = document.createElement("video");
  const vid2 = document.createElement("video");
  vid1.muted = vid2.muted = true;
  vid1.srcObject = stream1;
  vid2.srcObject = stream2;
  await Promise.all([vid1.play(), vid2.play()]);
  // Criando canvas do tamanho do video selecionado
  const canvas = document.createElement("canvas");
  let w = (canvas.width = vid1.videoWidth);
  let h = (canvas.height = vid1.videoHeight);
  const ctx = canvas.getContext("2d");

  // resize caso mude a fonte
  vid1.onresize = evt => {
    w = canvas.width = vid1.videoWidth;
    h = canvas.height = vid1.videoHeight;
  };
  anim();

  return canvas.captureStream();

  function anim() {
    // debugger;
    // joga o video no background
    ctx.drawImage(vid1, 0, 0);
    // calcula o tamanho do video da camera
    const cam_w = vid2.videoWidth;
    const cam_h = vid2.videoHeight;
    const cam_ratio = cam_w / cam_h;
    const out_h = h / 3;
    const out_w = out_h * cam_ratio;
    ctx.drawImage(vid2, w - out_w, h - out_h, out_w, out_h);

    setTimeout(function() {
      requestAnimationFrame(anim);
      //  requestAnimationFrame(anim);
    }, 1000 / 30);
  }
}

btn.onclick = async () => {
  const display_stream = await navigator.mediaDevices.getDisplayMedia();
  const cam_stream = await navigator.mediaDevices.getUserMedia({ video: true });
  const mixed_stream = await getOverlayedVideoStreams(
    display_stream,
    cam_stream
  );
  out.srcObject = mixed_stream;
  const ivsUrl = "";
  //envia para amazon
  const webSocket = new WebSocket(
    "ws://localhost:3004/rtmps/" + ivsUrl
  );

  console.log("como esta o webSocket", webSocket);

  console.log(isOpen(webSocket));

  webSocket.onerror = err => {
    console.error("on error: ", webSocket);
    console.error("on error: ", err);
  };

  webSocket.onclose = e => {
    console.log(" on close ", e.reason);
  };

  webSocket.onmessage = evt => {
    console.log("on message MSG!!", evt);
  };

  webSocket.onopen = e => {
    console.log("on open");
  };

  const sUsrAg = navigator.userAgent;
  let mediaRecorder;
  if (sUsrAg.indexOf("Firefox") > -1) {
    console.log("Firefox");

    mediaRecorder = new MediaRecorder(out.mozCaptureStream(30), {
      mimeType: "video/webm; codecs=h264,opus",
      videoBitsPerSecond: 3000000
    });
  } else {
    console.log("chrome");
    mediaRecorder = new MediaRecorder(out.captureStream(30), {
      mimeType: "video/webm; codecs=h264,opus",
      videoBitsPerSecond: 3000000
    });
  }

  mediaRecorder.addEventListener("dataavailable", e => {
    console.log("addEventListener");
    if (isOpen(webSocket)) {
      console.log("enviei");
      webSocket.send(e.data);
    }
  });
  mediaRecorder.start(1000);
};

function isOpen(ws) {
  return ws.readyState === ws.OPEN;
}
