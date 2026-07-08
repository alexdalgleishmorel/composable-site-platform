import { fontStyleCss, readText, type StyledText } from '@csp/blocks';

interface Props {
  paragraphs: StyledText[];
}

export const BioPanel = ({ paragraphs }: Props) => (
  <div className="panel glass bio-panel">
    <div className="bio-text">
      {paragraphs.map((p, i) => {
        const n = readText(p);
        return (
          <p key={i} style={fontStyleCss(n.style)}>
            {n.text}
          </p>
        );
      })}
    </div>
  </div>
);
