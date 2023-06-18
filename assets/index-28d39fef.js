(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function y(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=y(e);fetch(e.href,t)}})();const h=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const c=await navigator.gpu.requestAdapter();if(!c)throw new Error("No appropriate GPUAdapter found.");const r=await c.requestDevice(),f=h.getContext("webgpu"),d=navigator.gpu.getPreferredCanvasFormat();f.configure({device:r,format:d});const n=32,u=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),p=r.createBuffer({label:"Cell vertices",size:u.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});r.queue.writeBuffer(p,0,u);const P={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},l=r.createShaderModule({label:"Cell shader",code:`
          struct VertexInput {
            @location(0) pos: vec2f,
            @builtin(instance_index) instance: u32,
          };
          
          struct VertexOutput {
            @builtin(position) pos: vec4f,
            @location(0) cell: vec2f, // New line!
          };
          
          @group(0) @binding(0) var<uniform> grid: vec2f;
          
          @vertex
          fn vertexMain(input: VertexInput) -> VertexOutput  {
            let i = f32(input.instance);
            let cell = vec2f(i % grid.x, floor(i / grid.x));
            let cellOffset = cell / grid * 2;
            let gridPos = (input.pos + 1) / grid - 1 + cellOffset;
          
            var output: VertexOutput;
            output.pos = vec4f(gridPos, 0, 1);
            output.cell = cell; // New line!
            return output;
          }

          @fragment
          fn fragmentMain(@location(0) cell: vec2f) -> @location(0) vec4f {
            // Remember, fragment return values are (Red, Green, Blue, Alpha)
            // and since cell is a 2D vector, this is equivalent to:
            // (Red = cell.x, Green = cell.y, Blue = 0, Alpha = 1)
            return vec4f(cell, 0, 1);
          }
        `}),g=r.createRenderPipeline({label:"Cell pipeline",layout:"auto",vertex:{module:l,entryPoint:"vertexMain",buffers:[P]},fragment:{module:l,entryPoint:"fragmentMain",targets:[{format:d}]}}),m=new Float32Array([n,n]),v=r.createBuffer({label:"Grid Uniforms",size:m.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});r.queue.writeBuffer(v,0,m);const x=r.createBindGroup({label:"Cell renderer bind group",layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}}]}),b=r.createCommandEncoder(),o=b.beginRenderPass({colorAttachments:[{view:f.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});o.setPipeline(g);o.setBindGroup(0,x);o.setVertexBuffer(0,p);o.draw(u.length/2,n*n);o.end();r.queue.submit([b.finish()]);
