export const profile = {
  name: "Aldy Radya Herlambang",
  program: "Fisheries and Marine Technology and Business",
  university: "Diponegoro University",
  email: "Aldyradya2@gmail.com",
  whatsapp: "https://wa.me/6285150745232",
  phone: "0851 5074 5232",
  location: "Yogyakarta, Indonesia",
};
export const skills = [
  "Calm under pressure",
  "Attention to detail",
  "Public speaking",
  "Responsible and dependable",
  "Discipline and a strong work ethic",
];
export const categories = [
  "Organization",
  "Event committee",
  "Community service",
  "Personal development",
];
export interface Entry {
  slug: string;
  title: string;
  category: string;
  period: string;
  startDate: string;
  organization: string;
  description: string;
  imageUrl?: string;
  updatedAt?: string;
}
export interface Media {
  name: string;
  path: string;
  url: string;
  size: number;
  createdAt: string;
}
export async function getEntries(): Promise<{
  entries: Entry[];
  editable: boolean;
}> {
  const response = await fetch("/api/aldy/experiences", {
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error("Experience could not be loaded. Please try again.");
  return response.json();
}
