(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))d(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&d(s)}).observe(document,{childList:!0,subtree:!0});function B(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function d(e){if(e.ep)return;e.ep=!0;const n=B(e);fetch(e.href,n)}})();const h=`struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) cell: vec2f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

@vertex
fn vertexMain(@location(0) pos: vec2f,
              @builtin(instance_index) instance: u32) -> VertexOutput {
  let i = f32(instance);
  let cell = vec2f(i % grid.x, floor(i / grid.x));
  let state = f32(cellState[instance]);

  let cellOffset = cell / grid * 2;
  // New: Scale the position by the cell's active state.
  let gridPos = (pos*state+1) / grid - 1 + cellOffset;

  var output: VertexOutput;
  output.pos = vec4f(gridPos, 0, 1);
  output.cell = cell;
  return output;
}

@fragment
  fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let c = input.cell / grid;
  return vec4f(c, 1-c.x, 1);
}
`,U=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const b=await navigator.gpu.requestAdapter();if(!b)throw new Error("No appropriate GPUAdapter found.");const t=await b.requestDevice(),v=U.getContext("webgpu"),m=navigator.gpu.getPreferredCanvasFormat();v.configure({device:t,format:m});const a=32,f=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),y=t.createBuffer({label:"Cell vertices",size:f.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(y,0,f);const x={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},g=t.createShaderModule({label:"Cell shader",code:h}),c=t.createRenderPipeline({label:"Cell pipeline",layout:"auto",vertex:{module:g,entryPoint:"vertexMain",buffers:[x]},fragment:{module:g,entryPoint:"fragmentMain",targets:[{format:m}]}}),P=new Float32Array([a,a]),l=t.createBuffer({label:"Grid Uniforms",size:P.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(l,0,P);const i=new Uint32Array(a*a),u=[t.createBuffer({label:"Cell State A",size:i.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),t.createBuffer({label:"Cell State B",size:i.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let r=0;r<i.length;r+=3)i[r]=1;t.queue.writeBuffer(u[0],0,i);for(let r=0;r<i.length;r++)i[r]=r%2;t.queue.writeBuffer(u[1],0,i);const G=[t.createBindGroup({label:"Cell renderer bind group A",layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:u[0]}}]}),t.createBindGroup({label:"Cell renderer bind group B",layout:c.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:l}},{binding:1,resource:{buffer:u[1]}}]})],O=200;let p=0;function w(){p++;const r=t.createCommandEncoder(),o=r.beginRenderPass({colorAttachments:[{view:v.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});o.setPipeline(c),o.setBindGroup(0,G[p%2]),o.setVertexBuffer(0,y),o.draw(f.length/2,a*a),o.end(),t.queue.submit([r.finish()])}setInterval(w,O);
