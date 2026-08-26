type ServiceCardProps = {
  index: number;
  title: string;
  body: string;
  tone: string;
};

export function ServiceCard({ index, title, body, tone }: ServiceCardProps) {
  return (
    <article className={`service-card ${tone}`} data-reveal>
      <div className="service-art" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <span className="service-number">0{index}</span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}
