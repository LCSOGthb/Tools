type Props = {
  name: string;
  content: JSX.Element;
};

export default function ToolCard({ name, content }: Props) {
  return (
    <div className="tool-card">
      <h2>{name}</h2>
      {content}
    </div>
  );
}