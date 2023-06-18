(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))l(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&l(s)}).observe(document,{childList:!0,subtree:!0});function u(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function l(t){if(t.ep)return;t.ep=!0;const r=u(t);fetch(t.href,r)}})();const G=`struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) cell: vec2f,
};

@group(0) @binding(0) var<uniform> grid: vec2f;
@group(0) @binding(1) var<storage> cellState: array<u32>;

@vertex
fn vertexMain(@location(0) position: vec2f,
              @builtin(instance_index) instance: u32) -> VertexOutput {
  var output: VertexOutput;

  let i = f32(instance);
  let cell = vec2f(i % grid.x, floor(i / grid.x));

  let scale = f32(cellState[instance]);
  let cellOffset = cell / grid * 2;
  let gridPos = (position*scale+1) / grid - 1 + cellOffset;

  output.position = vec4f(gridPos, 0, 1);
  output.cell = cell / grid;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return vec4f(input.cell, 1.0 - input.cell.x, 1);
}
`,O=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const m=await navigator.gpu.requestAdapter();if(!m)throw new Error("No appropriate GPUAdapter found.");const e=await m.requestDevice(),h=O.getContext("webgpu"),P=navigator.gpu.getPreferredCanvasFormat();h.configure({device:e,format:P});const o=32,w=250,d=8,b=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),S=e.createBuffer({label:"Cell vertices",size:b.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(S,0,b);const B={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},g=e.createBindGroupLayout({label:"Cell Bind Group Layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}}]}),x=e.createPipelineLayout({label:"Cell Pipeline Layout",bindGroupLayouts:[g]}),y=e.createShaderModule({label:"Cell shader",code:G}),C=e.createRenderPipeline({label:"Cell pipeline",layout:x,vertex:{module:y,entryPoint:"vertexMain",buffers:[B]},fragment:{module:y,entryPoint:"fragmentMain",targets:[{format:P}]}}),A=e.createShaderModule({label:"Life simulation shader",code:`
  @group(0) @binding(0) var<uniform> grid: vec2f;

  @group(0) @binding(1) var<storage> cellStateIn: array<u32>;
  @group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

  fn cellIndex(cell: vec2u) -> u32 {
    return (cell.y % u32(grid.y)) * u32(grid.x) +
            (cell.x % u32(grid.x));
  }

  fn cellActive(x: u32, y: u32) -> u32 {
    return cellStateIn[cellIndex(vec2(x, y))];
  }

  @compute @workgroup_size(${d}, ${d})
  fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
    // Determine how many active neighbors this cell has.
    let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
                          cellActive(cell.x+1, cell.y) +
                          cellActive(cell.x+1, cell.y-1) +
                          cellActive(cell.x, cell.y-1) +
                          cellActive(cell.x-1, cell.y-1) +
                          cellActive(cell.x-1, cell.y) +
                          cellActive(cell.x-1, cell.y+1) +
                          cellActive(cell.x, cell.y+1);

    let i = cellIndex(cell.xy);

    // Conway's game of life rules:
    switch activeNeighbors {
      case 2: { // Active cells with 2 neighbors stay active.
        cellStateOut[i] = cellStateIn[i];
      }
      case 3: { // Cells with 3 neighbors become or stay active.
        cellStateOut[i] = 1;
      }
      default: { // Cells with < 2 or > 3 neighbors become inactive.
        cellStateOut[i] = 0;
      }
    }
  }
        `}),L=e.createComputePipeline({label:"Simulation pipeline",layout:x,compute:{module:A,entryPoint:"computeMain"}}),U=new Float32Array([o,o]),p=e.createBuffer({label:"Grid Uniforms",size:U.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});e.queue.writeBuffer(p,0,U);const c=new Uint32Array(o*o),a=[e.createBuffer({label:"Cell State A",size:c.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),e.createBuffer({label:"Cell State B",size:c.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let n=0;n<c.length;++n)c[n]=Math.random()>.6?1:0;e.queue.writeBuffer(a[0],0,c);const v=[e.createBindGroup({label:"Cell renderer bind group A",layout:g,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:a[0]}},{binding:2,resource:{buffer:a[1]}}]}),e.createBindGroup({label:"Cell renderer bind group B",layout:g,entries:[{binding:0,resource:{buffer:p}},{binding:1,resource:{buffer:a[1]}},{binding:2,resource:{buffer:a[0]}}]})];let f=0;function E(){const n=e.createCommandEncoder(),i=n.beginComputePass();i.setPipeline(L),i.setBindGroup(0,v[f%2]);const u=Math.ceil(o/d);i.dispatchWorkgroups(u,u),i.end(),f++;const l=n.beginRenderPass({colorAttachments:[{view:h.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});l.setPipeline(C),l.setBindGroup(0,v[f%2]),l.setVertexBuffer(0,S),l.draw(b.length/2,o*o),l.end(),e.queue.submit([n.finish()])}setInterval(E,w);
