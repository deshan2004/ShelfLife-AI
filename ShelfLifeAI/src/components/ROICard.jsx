import './ROICard.css'

export default function ROICard({ monthlySavings }) {
  return (
    <div className="roi-card">
      <i className="fas fa-chart-line roi-card-icon" />
      <h3>ROI That Pays for Itself</h3>
      <p>
        If the system saves just LKR 5,000 worth of stock per month, it pays for itself
        immediately. Reduce time spent on manual stock-checking by 90%.
      </p>
      <div className="roi-stats">
        <div className="roi-stat">
          <strong>LKR {monthlySavings.toLocaleString()}+</strong>
          <span>Monthly savings</span>
        </div>
        <div className="roi-stat">
          <strong>90%</strong>
          <span>Efficiency boost</span>
        </div>
        <div className="roi-stat">
          <strong>Zero waste</strong>
          <span>Smarter ordering</span>
        </div>
      </div>
    </div>
  )
}