// Tipos de dominio do board estilo Trello (funil de vendas).
// Compartilhado entre client e server — nao importar codigo server-only aqui.

export type PipelineStageType = "open" | "won" | "lost";

export type PipelineStage = {
  id: string;
  name: string;
  slug: string | null;
  position: number;
  color: string;
  type: PipelineStageType;
  isSystem: boolean;
  wipLimit: number | null;
};

export type BoardLabel = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export type BoardMember = {
  profileId: string;
  name: string;
  avatarUrl: string | null;
};

export type LeadCover = {
  color?: string | null;
  imageUrl?: string | null;
};

export type BoardChecklistItem = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export type BoardChecklist = {
  id: string;
  title: string;
  position: number;
  items: BoardChecklistItem[];
};
