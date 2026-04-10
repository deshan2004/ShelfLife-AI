import './FeatureCard.css'

export default function FeatureCard({ icon, title, desc }) {
  return (
    <div className="feature-card">
      <div className="feat-icon-wrap">
        <i className={`fas ${icon}`} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  )
}