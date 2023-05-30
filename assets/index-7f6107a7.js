(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))c(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&c(a)}).observe(document,{childList:!0,subtree:!0});function y(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function c(e){if(e.ep)return;e.ep=!0;const r=y(e);fetch(e.href,r)}})();const h=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const u=await navigator.gpu.requestAdapter();if(!u)throw new Error("No appropriate GPUAdapter found.");const t=await u.requestDevice(),l=h.getContext("webgpu"),d=navigator.gpu.getPreferredCanvasFormat();l.configure({device:t,format:d});const n=32,s=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),g=t.createBuffer({label:"Cell vertices",size:s.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(g,0,s);const P={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},f=t.createShaderModule({label:"Cell shader",code:`
          @group(0) @binding(0) var<uniform> grid: vec2f;

          @vertex
          fn vertexMain(@location(0) pos: vec2f,
                        @builtin(instance_index) instance: u32) ->
          @builtin(position) vec4f {
        
          let i = f32(instance);
          // Compute the cell coordinate from the instance_index
          let cell = vec2f(i % grid.x, floor(i / grid.x));
        
          let cellOffset = cell / grid * 2;
          let gridPos = (pos + 1) / grid - 1 + cellOffset;
        
          return vec4f(gridPos, 0, 1);
          }

          @fragment
          fn fragmentMain() -> @location(0) vec4f {
            return vec4f(1, 0, 0, 1);
          }
        `}),p=t.createRenderPipeline({label:"Cell pipeline",layout:"auto",vertex:{module:f,entryPoint:"vertexMain",buffers:[P]},fragment:{module:f,entryPoint:"fragmentMain",targets:[{format:d}]}}),m=new Float32Array([n,n]),v=t.createBuffer({label:"Grid Uniforms",size:m.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(v,0,m);const w=t.createBindGroup({label:"Cell renderer bind group",layout:p.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}}]}),b=t.createCommandEncoder(),o=b.beginRenderPass({colorAttachments:[{view:l.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});o.setPipeline(p);o.setBindGroup(0,w);o.setVertexBuffer(0,g);o.draw(s.length/2,n*n);o.end();t.queue.submit([b.finish()]);
