// https://github.com/Jam3/ios-safe-audio-context
function createAudioContext(e){var t=window.AudioContext||window.webkitAudioContext;e="number"==typeof e?e:44100;var n=new t;if(/(iPhone|iPad)/i.test(navigator.userAgent)&&n.sampleRate!==e){console.log("SR->"+n.sampleRate);var o=n.createBuffer(1,1,e),i=n.createBufferSource();i.buffer=o,i.connect(n.destination),i.start(0),i.disconnect(),n.close(),n=new t,tiles.dev("iOS context fixed")}return n}