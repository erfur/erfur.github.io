'use strict';
// WebGL2 visualization of a BFS search trace from solver.js `solveTrace`.
// Exposes window.BFSViz.create(canvas) -> controller.
(function () {
  const POINT_VS = `#version 300 es
  precision highp float;
  in vec2 a_pos; in float a_depth; in float a_kind; in float a_pathPos;
  uniform float u_t, u_searchEnd, u_time, u_dpr;
  uniform mat3 u_view;
  uniform vec3 c_visited, c_frontier, c_goal, c_path, c_start;
  out vec4 v_color;
  void main(){
    if (a_depth > u_t) { gl_Position = vec4(2.0,2.0,0.0,1.0); gl_PointSize = 0.0; v_color = vec4(0.0); return; }
    vec3 p = u_view * vec3(a_pos, 1.0);
    gl_Position = vec4(p.xy, 0.0, 1.0);
    bool frontier = (a_depth >= floor(u_t) - 0.001) && (u_t < u_searchEnd + 0.001);
    vec3 col = frontier ? c_frontier : c_visited;
    float sz = frontier ? 5.0 : 3.0;
    bool revealed = (a_pathPos >= 0.0) && (u_t >= u_searchEnd + a_pathPos - 0.001);
    if (revealed) { col = c_path; sz = 5.0; }
    if (a_kind > 2.5) { col = c_start; sz = 6.0; }
    if (a_kind > 1.5 && a_kind < 2.5) { float pulse = 0.5 + 0.5*sin(u_time*4.0); col = mix(c_path, c_goal, pulse); sz = 9.0; }
    v_color = vec4(col, 1.0);
    gl_PointSize = sz * u_dpr;
  }`;
  const POINT_FS = `#version 300 es
  precision highp float;
  in vec4 v_color; out vec4 o;
  void main(){ vec2 d = gl_PointCoord - vec2(0.5); if (dot(d,d) > 0.25) discard; o = v_color; }`;
  const LINE_VS = `#version 300 es
  precision highp float;
  in vec2 a_pos; in float a_depth; in float a_pathPos;
  uniform float u_t, u_searchEnd; uniform mat3 u_view;
  uniform vec3 c_visited, c_frontier, c_path;
  out vec4 v_color;
  void main(){
    if (a_depth > u_t) { gl_Position = vec4(2.0,2.0,0.0,1.0); v_color = vec4(0.0); return; }
    vec3 p = u_view * vec3(a_pos, 1.0);
    gl_Position = vec4(p.xy, 0.0, 1.0);
    bool frontier = (a_depth >= floor(u_t) - 0.001) && (u_t < u_searchEnd + 0.001);
    vec3 col = frontier ? c_frontier : c_visited;
    float a = frontier ? 0.7 : 0.35;
    bool revealed = (a_pathPos >= 0.0) && (u_t >= u_searchEnd + a_pathPos - 0.001);
    if (revealed) { col = c_path; a = 1.0; }
    v_color = vec4(col, a);
  }`;
  const LINE_FS = `#version 300 es
  precision highp float;
  in vec4 v_color; out vec4 o;
  void main(){ o = v_color; }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s));
    return s;
  }
  function program(gl, vs, fs) {
    const p = gl.createProgram();
    const v = compile(gl, gl.VERTEX_SHADER, vs);
    const f = compile(gl, gl.FRAGMENT_SHADER, fs);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    gl.deleteShader(v);
    gl.deleteShader(f);
    return p;
  }

  const EDGE_CAP = 60000; // beyond this many nodes, skip drawing tree edges

  function layout(trace) {
    const nodes = trace.nodes, n = nodes.length;
    const children = Array.from({ length: n }, () => []);
    for (let i = 1; i < n; i++) children[nodes[i].parent].push(i);
    const leaf = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      if (children[i].length === 0) leaf[i] = 1;
      else { let s = 0; for (const c of children[i]) s += leaf[c]; leaf[i] = s; }
    }
    const a0 = new Float64Array(n), a1 = new Float64Array(n);
    a0[0] = 0; a1[0] = Math.PI * 2;
    const pos = new Float32Array(n * 2);
    const ring = 1.0;
    for (let i = 0; i < n; i++) {
      const cs = children[i];
      if (cs.length) {
        let cursor = a0[i]; const span = a1[i] - a0[i]; const tot = leaf[i] || 1;
        for (const c of cs) { const w = span * (leaf[c] / tot); a0[c] = cursor; a1[c] = cursor + w; cursor += w; }
      }
      const r = nodes[i].depth * ring;
      const ang = (a0[i] + a1[i]) * 0.5;
      pos[i * 2] = r * Math.cos(ang); pos[i * 2 + 1] = r * Math.sin(ang);
    }
    return { pos, fitRadius: Math.max(trace.maxDepth, 1) * ring };
  }

  function create(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('no webgl2');
    const pProg = program(gl, POINT_VS, POINT_FS);
    const lProg = program(gl, LINE_VS, LINE_FS);

    const state = {
      raf: 0, last: 0, playing: false, t: 0, speed: 8,
      searchEnd: 0, revealSpan: 0, total: 0, maxDepth: 0,
      zoom: 1, panX: 0, panY: 0, fitRadius: 1, dpr: Math.min(window.devicePixelRatio || 1, 2),
      nNodes: 0, nEdges: 0, skipEdges: false, cumByDepth: null, tickCb: null, alive: true, solvable: false
    };
    const buf = {};

    const attr = (prog, name) => gl.getAttribLocation(prog, name);
    const uni = (prog, name) => gl.getUniformLocation(prog, name);
    function makeBuf(loc, data, size) {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { b, loc, size };
    }
    function bindAttr(a) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.b);
      gl.enableVertexAttribArray(a.loc);
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, 0, 0);
    }

    const locs = {
      p: { pos: attr(pProg, 'a_pos'), depth: attr(pProg, 'a_depth'), kind: attr(pProg, 'a_kind'), path: attr(pProg, 'a_pathPos') },
      l: { pos: attr(lProg, 'a_pos'), depth: attr(lProg, 'a_depth'), path: attr(lProg, 'a_pathPos') }
    };
    const u = {
      p: { t: uni(pProg, 'u_t'), se: uni(pProg, 'u_searchEnd'), time: uni(pProg, 'u_time'), dpr: uni(pProg, 'u_dpr'), view: uni(pProg, 'u_view'),
           cv: uni(pProg, 'c_visited'), cf: uni(pProg, 'c_frontier'), cg: uni(pProg, 'c_goal'), cp: uni(pProg, 'c_path'), cs: uni(pProg, 'c_start') },
      l: { t: uni(lProg, 'u_t'), se: uni(lProg, 'u_searchEnd'), view: uni(lProg, 'u_view'),
           cv: uni(lProg, 'c_visited'), cf: uni(lProg, 'c_frontier'), cp: uni(lProg, 'c_path') }
    };
    const COL = { visited: [0.30, 0.42, 0.62], frontier: [0.49, 0.83, 0.99], goal: [0.98, 0.85, 0.27], path: [0.13, 0.82, 0.45], start: [0.95, 0.95, 0.99] };

    function load(trace) {
      for (const k in buf) { if (buf[k] && buf[k].b) gl.deleteBuffer(buf[k].b); delete buf[k]; }
      state.solvable = trace.solvable;
      state.maxDepth = trace.maxDepth;
      state.searchEnd = trace.maxDepth;
      state.revealSpan = 0;
      state.total = state.searchEnd + state.revealSpan;
      state.t = 0;
      const n = trace.nodes.length; state.nNodes = n;
      const { pos, fitRadius } = layout(trace);
      state.fitRadius = fitRadius;

      const depth = new Float32Array(n), kind = new Float32Array(n), pathPos = new Float32Array(n);
      pathPos.fill(-1);
      for (let i = 0; i < n; i++) depth[i] = trace.nodes[i].depth;
      kind[0] = 3; // start
      if (trace.solvable) {
        for (let k = 0; k < trace.pathIndices.length; k++) {
          const idx = trace.pathIndices[k];
          pathPos[idx] = 0;
          if (kind[idx] === 0) kind[idx] = 1;
        }
        kind[trace.goalIndex] = 2;
      }
      const cum = new Int32Array(trace.maxDepth + 1);
      for (let i = 0; i < n; i++) cum[trace.nodes[i].depth]++;
      for (let d = 1; d <= trace.maxDepth; d++) cum[d] += cum[d - 1];
      state.cumByDepth = cum;

      buf.pPos = makeBuf(locs.p.pos, pos, 2);
      buf.pDepth = makeBuf(locs.p.depth, depth, 1);
      buf.pKind = makeBuf(locs.p.kind, kind, 1);
      buf.pPath = makeBuf(locs.p.path, pathPos, 1);

      state.skipEdges = n > EDGE_CAP;
      if (!state.skipEdges && n > 1) {
        const ne = n - 1; state.nEdges = ne;
        const ePos = new Float32Array(ne * 4), eDepth = new Float32Array(ne * 2), ePath = new Float32Array(ne * 2);
        let e = 0;
        for (let i = 1; i < n; i++) {
          const par = trace.nodes[i].parent;
          ePos[e*4] = pos[i*2]; ePos[e*4+1] = pos[i*2+1];
          ePos[e*4+2] = pos[par*2]; ePos[e*4+3] = pos[par*2+1];
          eDepth[e*2] = depth[i]; eDepth[e*2+1] = depth[i];
          const edgePathPos = pathPos[i] >= 0 ? 0 : -1;
          ePath[e*2] = edgePathPos; ePath[e*2+1] = edgePathPos;
          e++;
        }
        buf.lPos = makeBuf(locs.l.pos, ePos, 2);
        buf.lDepth = makeBuf(locs.l.depth, eDepth, 1);
        buf.lPath = makeBuf(locs.l.path, ePath, 1);
      } else { state.nEdges = 0; }

      resetView();
      state.playing = true; state.last = 0;
      requestFrame();
    }

    function resize() {
      const w = Math.max(1, Math.floor(canvas.clientWidth * state.dpr));
      const h = Math.max(1, Math.floor(canvas.clientHeight * state.dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function viewMatrix() {
      const halfW = canvas.width / 2, halfH = canvas.height / 2;
      const fit = (Math.min(halfW, halfH) * 0.92) / state.fitRadius;
      const s = fit * state.zoom;
      const tx = state.panX * state.dpr, ty = -state.panY * state.dpr;
      return new Float32Array([
        s / halfW, 0, 0,
        0, s / halfH, 0,
        tx / halfW, ty / halfH, 1
      ]);
    }

    function draw() {
      resize();
      gl.clearColor(0.043, 0.051, 0.075, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const view = viewMatrix();
      if (state.nEdges) {
        gl.useProgram(lProg);
        gl.uniform1f(u.l.t, state.t); gl.uniform1f(u.l.se, state.searchEnd);
        gl.uniformMatrix3fv(u.l.view, false, view);
        gl.uniform3fv(u.l.cv, COL.visited); gl.uniform3fv(u.l.cf, COL.frontier); gl.uniform3fv(u.l.cp, COL.path);
        bindAttr(buf.lPos); bindAttr(buf.lDepth); bindAttr(buf.lPath);
        gl.drawArrays(gl.LINES, 0, state.nEdges * 2);
      }
      gl.useProgram(pProg);
      gl.uniform1f(u.p.t, state.t); gl.uniform1f(u.p.se, state.searchEnd);
      gl.uniform1f(u.p.time, performance.now() / 1000); gl.uniform1f(u.p.dpr, state.dpr);
      gl.uniformMatrix3fv(u.p.view, false, view);
      gl.uniform3fv(u.p.cv, COL.visited); gl.uniform3fv(u.p.cf, COL.frontier);
      gl.uniform3fv(u.p.cg, COL.goal); gl.uniform3fv(u.p.cp, COL.path); gl.uniform3fv(u.p.cs, COL.start);
      bindAttr(buf.pPos); bindAttr(buf.pDepth); bindAttr(buf.pKind); bindAttr(buf.pPath);
      gl.drawArrays(gl.POINTS, 0, state.nNodes);
    }

    function tick() {
      if (!state.tickCb) return;
      const d = Math.min(Math.floor(state.t), state.maxDepth);
      const visited = state.cumByDepth ? state.cumByDepth[Math.max(0, Math.min(d, state.maxDepth))] : 0;
      let note = state.skipEdges ? ('edges hidden (' + state.nNodes + ' nodes)') : '';
      if (state.t >= state.searchEnd) {
        const tail = state.solvable ? 'path traced' : 'no solution';
        note = note ? note + ' · ' + tail : tail;
      }
      state.tickCb({ t: state.t, depth: d, maxDepth: state.maxDepth, visited, playing: state.playing, note });
    }

    function requestFrame() {
      if (!state.raf && state.alive) state.raf = requestAnimationFrame(loop);
    }

    function loop(now) {
      state.raf = 0;
      if (!state.alive) return;
      const dt = state.last ? (now - state.last) / 1000 : 0; state.last = now;
      if (state.playing) {
        state.t += state.speed * dt;
        if (state.t >= state.total) { state.t = state.total; state.playing = false; }
      }
      draw();
      tick();
      if (state.playing) requestFrame();
    }

    function resetView() { state.zoom = 1; state.panX = 0; state.panY = 0; requestFrame(); }

    let dragging = false, lx = 0, ly = 0;
    const onDown = e => { dragging = true; lx = e.clientX; ly = e.clientY; };
    const onUp = () => { dragging = false; };
    const onMove = e => { if (!dragging) return; state.panX += (e.clientX - lx); state.panY += (e.clientY - ly); lx = e.clientX; ly = e.clientY; requestFrame(); };
    const onWheel = e => { e.preventDefault(); const f = Math.exp(-e.deltaY * 0.001); state.zoom = Math.max(0.2, Math.min(40, state.zoom * f)); requestFrame(); };
    const onResize = () => requestFrame();
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return {
      load,
      play() { state.playing = true; state.last = 0; requestFrame(); },
      pause() { state.playing = false; },
      toggle() { state.playing = !state.playing; state.last = 0; requestFrame(); },
      setSpeed(v) { state.speed = v; },
      seek(t) { state.t = Math.max(0, Math.min(state.total, t)); state.playing = false; requestFrame(); },
      resetView,
      total() { return state.total; },
      onTick(cb) { state.tickCb = cb; },
      destroy() {
        state.alive = false;
        if (state.raf) cancelAnimationFrame(state.raf);
        state.raf = 0;
        canvas.removeEventListener('mousedown', onDown);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('resize', onResize);
        canvas.removeEventListener('wheel', onWheel);
        for (const k in buf) { if (buf[k] && buf[k].b) gl.deleteBuffer(buf[k].b); delete buf[k]; }
        gl.deleteProgram(pProg);
        gl.deleteProgram(lProg);
      }
    };
  }

  window.BFSViz = { create };
})();
