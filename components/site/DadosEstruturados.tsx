type DadosEstruturadosProps = {
  data: Record<string, unknown>;
};

export function DadosEstruturados({ data }: DadosEstruturadosProps) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
