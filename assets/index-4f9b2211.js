(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&s(a)}).observe(document,{childList:!0,subtree:!0});function y(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(e){if(e.ep)return;e.ep=!0;const r=y(e);fetch(e.href,r)}})();const h=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const f=await navigator.gpu.requestAdapter();if(!f)throw new Error("No appropriate GPUAdapter found.");const t=await f.requestDevice(),l=h.getContext("webgpu"),d=navigator.gpu.getPreferredCanvasFormat();l.configure({device:t,format:d});const u=4,i=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),p=t.createBuffer({label:"Cell vertices",size:i.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(p,0,i);const P={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},c=t.createShaderModule({label:"Cell shader",code:`
          @group(0) @binding(0) var<uniform> grid: vec2f;

          @vertex
          fn vertexMain(@location(0) pos: vec2f) ->
            @builtin(position) vec4f {
            return vec4f(pos / grid, 0, 1);
          }

          @fragment
          fn fragmentMain() -> @location(0) vec4f {
            return vec4f(1, 0, 0, 1);
          }
        `}),g=t.createRenderPipeline({label:"Cell pipeline",layout:"auto",vertex:{module:c,entryPoint:"vertexMain",buffers:[P]},fragment:{module:c,entryPoint:"fragmentMain",targets:[{format:d}]}}),m=new Float32Array([u,u]),v=t.createBuffer({label:"Grid Uniforms",size:m.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});t.queue.writeBuffer(v,0,m);const w=t.createBindGroup({label:"Cell renderer bind group",layout:g.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:v}}]}),b=t.createCommandEncoder(),o=b.beginRenderPass({colorAttachments:[{view:l.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});o.setPipeline(g);o.setBindGroup(0,w);o.setVertexBuffer(0,p);o.draw(i.length/2);o.end();t.queue.submit([b.finish()]);
