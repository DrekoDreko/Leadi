import { CheckCircle2, FileText, Sparkles } from "lucide-react";
import { campaignDraft } from "@/data/mock";
import { Metric, PageHeading } from "@/components/dashboard/widgets";

const audienceTags = ["MEI", "ME", "LTDA", "2 a 49 vidas", "Campinas e região"];

export default function CampanhasPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        eyebrow="Campanhas"
        title="IA de campanha"
        description="Área dedicada para gerar textos, organizar campos do formulário e revisar o material antes do Meta Ads."
      >
        <button className="inline-flex items-center gap-2 rounded-full bg-cobalt px-5 py-3 text-sm font-semibold text-white">
          <Sparkles size={18} aria-hidden="true" />
          Gerar campanha
        </button>
      </PageHeading>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Campanhas ativas" value="6" note="+2 rascunhos" tone="blue" />
        <Metric label="Leads captados" value="128" note="+18% no mês" tone="teal" />
        <Metric label="CPL médio" value="R$ 19" note="-8% na semana" tone="yellow" />
        <Metric label="Aprovação" value="94%" note="compliance" tone="dark" />
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch">
        <div className="min-w-0 flex h-full flex-col gap-4">
          <section className="glass-strong rounded-[34px] p-6 xl:flex-1">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-ink/54">Texto sugerido</p>
                <h2 className="mt-2 text-3xl font-semibold">{campaignDraft.title}</h2>
              </div>
              <Sparkles className="text-cobalt" size={28} aria-hidden="true" />
            </div>
            <p className="max-w-3xl leading-7 text-ink/66">{campaignDraft.copy}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {audienceTags.map((tag) => (
                <span className="rounded-full bg-white/58 px-3 py-1.5 text-xs font-semibold" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="glass rounded-[34px] p-6 xl:shrink-0">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Formulário</h2>
              <FileText size={21} aria-hidden="true" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {campaignDraft.formFields.map((field) => (
                <div className="flex items-center gap-3 rounded-2xl bg-white/42 px-4 py-3" key={field}>
                  <CheckCircle2 size={18} className="text-lagoon" aria-hidden="true" />
                  <span className="text-sm font-medium">{field}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="flex h-full flex-col">
          <section className="glass rounded-[34px] p-5 h-full">
            <h2 className="font-semibold">Fila criativa</h2>
            <div className="mt-5 space-y-3">
              {["Carrossel consultivo", "Vídeo curto para empresas", "Imagem para lead form"].map((item, index) => (
                <div className="rounded-[24px] bg-white/42 p-4" key={item}>
                  <p className="text-sm text-ink/52">Peça {index + 1}</p>
                  <h3 className="mt-1 font-semibold">{item}</h3>
                  <span className="mt-4 inline-flex rounded-full bg-signal px-3 py-1.5 text-xs font-semibold text-ink">
                    aguardando briefing
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
