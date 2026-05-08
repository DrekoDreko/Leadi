import { ComplianceValidator } from "../../compliance/compliance-validator";

export default function CriacoesCompliancePage() {
  return (
    <ComplianceValidator
      description="Revise textos de anuncio, formulario e mensagem antes de publicar ou enviar."
      eyebrow="Criações"
      title="Validador de texto"
    />
  );
}
