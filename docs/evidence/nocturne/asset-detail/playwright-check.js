// Run with Playwright MCP browser_run_code_unsafe filename, against the local dev server.
// Read-only renderer inspection via Fiber's development root map; no production probe added.
async (page) => {
  await page.goto('http://127.0.0.1:5196')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.locator('#scene-select').selectOption('nocturne')
  await page.locator('.nocturne-stage canvas').waitFor()
  const select = async (id, value) => {
    await page.evaluate(() => { document.querySelector('details').open = true })
    await page.locator('#' + id).selectOption(value)
    await page.evaluate(() => { document.querySelector('details').open = false })
  }
  await select('nocturne-lighting-mode', 'manual')
  await page.waitForTimeout(1800)
  await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(x => x.name).find(x => x.includes('/@react-three_fiber.js'))
    const fiber = await import(url)
    window.detailRoot = () => fiber._roots.get(document.querySelector('canvas'))?.store.getState()
    window.detailSample = () => {
      const { gl, scene } = window.detailRoot()
      let invalidMatrices = 0, unassignedEmitting = 0
      const batches = {}
      scene.traverse(o => {
        if (!o.isInstancedMesh) return
        batches[o.name] = o.count
        for (const v of o.instanceMatrix.array) if (!Number.isFinite(v)) invalidMatrices++
        const a = o.geometry.getAttribute('nocturneLevel'), ix = o.userData.nocturneSpatialIndices
        if (a && ix) ix.forEach((x, i) => { if (x === 255 && a.array[i] !== 0) unassignedEmitting++ })
      })
      return { geometries: gl.info.memory.geometries, textures: gl.info.memory.textures,
        programs: gl.info.programs.length, invalidMatrices, unassignedEmitting, batches,
        buffer: [gl.domElement.width, gl.domElement.height] }
    }
  })
  const report = { source: 'Playwright MCP, dev build, SwiftShader; Manual all-on, reduced motion. Resource/lifecycle and layout checks, not hardware performance.', samples: [], disposal: [], screenshots: [] }
  const sample = async label => {
    const value = await page.evaluate(() => window.detailSample())
    if (value.invalidMatrices || value.unassignedEmitting) throw Error('Invalid geometry or emitting hardware')
    report.samples.push({ label, ...value })
    return value
  }
  const shot = async name => {
    const path = `docs/evidence/nocturne/asset-detail/${name}.png`
    await page.screenshot({ path, scale: 'css' })
    report.screenshots.push(path)
  }
  await sample('standard-start')
  await shot('playwright-standard')
  for (let i = 0; i < 3; i++) {
    await select('graphics-quality', 'low')
    await page.waitForTimeout(800)
    await sample(`low-${i}`)
    if (!i) await shot('playwright-low')
    await select('graphics-quality', 'standard')
    await page.waitForTimeout(800)
    await sample(`standard-${i}`)
  }
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      window.detailDisposed = []
      const mat = window.detailRoot().scene.getObjectByName('nocturne-frame').material
      for (const texture of [mat.map, mat.roughnessMap]) texture.addEventListener('dispose', () => window.detailDisposed.push(texture.name))
    })
    await page.locator('#scene-select').selectOption('lavender-peaks')
    await page.locator('.lavender-stage canvas').waitFor()
    await page.waitForTimeout(400)
    const disposed = await page.evaluate(() => window.detailDisposed)
    if (disposed.length !== 2) throw Error(`Hardware maps not disposed: ${disposed}`)
    report.disposal.push(disposed)
    await page.locator('#scene-select').selectOption('nocturne')
    await page.locator('.nocturne-stage canvas').waitFor()
    await page.waitForTimeout(1500)
    await sample(`returned-${i}`)
  }
  for (const label of ['low-', 'standard-', 'returned-']) {
    const samples = report.samples.filter(s => s.label.startsWith(label))
    const signature = s => JSON.stringify([s.geometries, s.textures, s.programs])
    if (!samples.every(s => signature(s) === signature(samples[0]))) throw Error(`Resource growth: ${label}`)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(600)
  await shot('playwright-portrait-standard')
  await select('graphics-quality', 'low')
  await page.waitForTimeout(600)
  await shot('playwright-portrait-low')
  report.layout = await page.evaluate(() => ({ width: innerWidth, contentWidth: document.documentElement.scrollWidth,
    height: innerHeight, contentHeight: document.documentElement.scrollHeight, canvases: document.querySelectorAll('canvas').length }))
  if (report.layout.contentWidth > report.layout.width || report.layout.contentHeight > report.layout.height || report.layout.canvases !== 1) throw Error('Overflow or duplicate canvas')
  await page.goto('about:blank')
  return report
}
