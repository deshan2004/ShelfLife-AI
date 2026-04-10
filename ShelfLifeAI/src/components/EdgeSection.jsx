import './EdgeSection.css'

const edges = [
  {
    icon: 'fa-camera',
    title: 'OCR vs. Barcode',
    desc: 'Most apps require barcodes. We use OCR to read expiry dates directly from packaging — crucial for local products without barcodes.',
  },
  {
    icon: 'fa-wifi',
    title: 'Offline-First PWA',
    desc: 'Small shops often have unstable internet. Our system works fully offline and syncs data once the connection returns.',
  },
  {
    icon: 'fa-lightbulb',
    title: 'Actionable Intelligence',
    desc: "We don't just show a red alert. We provide a business solution — return to supplier or trigger a flash sale.",
  },
]

export default function EdgeSection() {
  return (
    <div className="edge-section">
      <div className="edge-grid">
        <div>
          <p className="section-eyebrow">Our Edge</p>
          <h2 className="section-heading" style={{ fontSize: '1.75rem' }}>
            Why ShelfLife AI is Special
          </h2>

          <ul className="edge-list">
            {edges.map((e, i) => (
              <li key={i}>
                <div className="edge-item-icon">
                  <i className={`fas ${e.icon}`} />
                </div>
                <div>
                  <span className="edge-item-title">{e.title}</span>
                  <span className="edge-item-desc">{e.desc}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="tech-pill">
            <i className="fab fa-react" /> React + Firebase &nbsp;|&nbsp;
            <i className="fas fa-eye" /> Tesseract.js OCR &nbsp;|&nbsp;
            <i className="fab fa-node-js" /> Node.js
          </div>
        </div>

        <div className="edge-stat-box">
          <div className="stat-big-number">99.9%</div>
          <div className="stat-big-label">Data accuracy</div>
          <div className="sqa-badge">SQA Verified</div>
        </div>
      </div>
    </div>
  )
}