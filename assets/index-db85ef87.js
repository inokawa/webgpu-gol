(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))l(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const u of r.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&l(u)}).observe(document,{childList:!0,subtree:!0});function x(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function l(e){if(e.ep)return;e.ep=!0;const r=x(e);fetch(e.href,r)}})();const w=`struct VertexInput {
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
`,B=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const d=await navigator.gpu.requestAdapter();if(!d)throw new Error("No appropriate GPUAdapter found.");const t=await d.requestDevice(),p=B.getContext("webgpu"),g=navigator.gpu.getPreferredCanvasFormat();p.configure({device:t,format:g});const n=32,c=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),v=t.createBuffer({label:"Cell vertices",size:c.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(v,0,c);const O={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},f=t.createShaderModule({label:"Cell shader",code:w}),b=t.createRenderPipeline({label:"Cell pipeline",layout:"auto",vertex:{module:f,entryPoint:"vertexMain",buffers:[O]},fragment:{module:f,entryPoint:"fragmentMain",targets:[{format:g}]}}),m=new Float32Array([n,n]),y=t.createBuffer({label:"Grid Uniforms",size:m.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(y,0,m);const a=new Uint32Array(n*n),h=t.createBuffer({label:"Cell State",size:a.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});for(let i=0;i<a.length;i+=3)a[i]=1;t.queue.writeBuffer(h,0,a);const S=t.createBindGroup({label:"Cell renderer bind group",layout:b.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:y}},{binding:1,resource:{buffer:h}}]}),P=t.createCommandEncoder(),o=P.beginRenderPass({colorAttachments:[{view:p.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});o.setPipeline(b);o.setBindGroup(0,S);o.setVertexBuffer(0,v);o.draw(c.length/2,n*n);o.end();t.queue.submit([P.finish()]);
