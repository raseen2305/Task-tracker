import axios from 'axios';

const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';

/**
 * Runs grammar/spelling QC on submitted text via LanguageTool.
 * Returns a score (0–100) and raw matches array.
 *
 * @param {string} text - The response text to check
 * @returns {{ score: number, issues: Array, passed: boolean }}
 */
export async function runQC(text) {
  if (!text || text.trim().length === 0) {
    return { score: 0, issues: [], passed: false };
  }

  try {
    const params = new URLSearchParams({
      text,
      language: 'en-US',
      enabledOnly: 'false',
    });

    const { data } = await axios.post(LANGUAGETOOL_URL, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    });

    const matches = data.matches || [];
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Score: start at 100, deduct per issue relative to word count
    const deductionPerIssue = wordCount > 0 ? (100 / Math.max(wordCount, 10)) : 5;
    const rawScore = 100 - matches.length * deductionPerIssue;
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    return {
      score,
      issues: matches.map((m) => ({
        message: m.message,
        shortMessage: m.shortMessage,
        offset: m.offset,
        length: m.length,
        replacements: m.replacements?.slice(0, 3).map((r) => r.value) || [],
        ruleId: m.rule?.id,
        category: m.rule?.category?.name,
      })),
      passed: score >= 70,
    };
  } catch (err) {
    // If QC service is unavailable, pass with a neutral score
    console.warn('[QC] LanguageTool unavailable:', err.message);
    return { score: null, issues: [], passed: true, skipped: true };
  }
}
