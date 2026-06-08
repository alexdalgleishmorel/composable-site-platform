interface Props {
  paragraphs: string[];
}

export const BioPanel = ({ paragraphs }: Props) => (
  <div className="panel glass bio-panel">
    <div className="bio-text">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  </div>
);
