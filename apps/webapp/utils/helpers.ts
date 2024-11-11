export const parseSummary = (summary: string) => {
    const cleanedSummary = summary.replace(/```json\n|```/g, "");
    return JSON.parse(cleanedSummary);
}